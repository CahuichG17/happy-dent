// Motor de automatizaciones: dispara mensajes por eventos (cita creada/confirmada/
// cancelada) y por tiempo (recordatorios, seguimiento, cumpleaños).
// Cada envío se registra en message_log con una llave única (dedupeKey) para que
// nunca se mande dos veces el mismo mensaje.
import { and, desc, eq, gte, inArray, isNotNull, lte } from 'drizzle-orm';
import { db } from '../../db';
import {
  appointments, automations, doctors, messageLog, messageTemplates, patients, services, user,
} from '../../db/schema';
import { getConfig } from '../content';
import { ensureCommsTables } from './ddl';
import { sendEmail } from './mailer';
import { DEFAULTS, renderTemplate } from './templates';
import { addDays, apptInstant, hhmm12, longDate, nowCancun } from './time';

type Automation = typeof automations.$inferSelect;
type Owner = { id: string; name: string; email: string; role: string; doctorId: number | null };

const MIN = 60_000;

/** Crea las plantillas/automatizaciones sugeridas la primera vez (todas apagadas). */
export async function ensureDefaults(userId: string): Promise<void> {
  await ensureCommsTables();
  const existing = await db.select({ id: automations.id }).from(automations).where(eq(automations.userId, userId)).limit(1);
  if (existing.length) return;
  for (const d of DEFAULTS) {
    const [tpl] = await db.insert(messageTemplates).values({
      userId, name: d.tplName, channel: d.channel, subject: d.subject, body: d.body,
    }).returning({ id: messageTemplates.id });
    await db.insert(automations).values({
      userId, name: d.name, trigger: d.trigger, channel: d.channel, recipient: d.recipient,
      templateId: tpl.id, offsetMin: d.offsetMin, enabled: false,
    });
  }
}

async function getOwner(userId: string): Promise<Owner | null> {
  const [u] = await db.select({
    id: user.id, name: user.name, email: user.email, role: user.role, doctorId: user.doctorId,
  }).from(user).where(eq(user.id, userId)).limit(1);
  return u ?? null;
}

function waLink(phone: string, text: string): string | null {
  let d = phone.replace(/\D/g, '');
  if (d.length === 10) d = `52${d}`;
  if (d.length < 11) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

type Ctx = {
  dedupe: string; vars: Record<string, string>; patientName: string;
  email?: string | null; phone?: string | null; appointmentId?: number;
};

async function deliver(auto: Automation, owner: Owner, ctx: Ctx): Promise<void> {
  if (!auto.templateId) return;
  const [tpl] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, auto.templateId)).limit(1);
  if (!tpl) return;

  const subject = renderTemplate(tpl.subject, ctx.vars);
  const body = renderTemplate(tpl.body, ctx.vars);
  const toDoctor = auto.recipient === 'doctor';
  const toAddr = auto.channel === 'email' ? (toDoctor ? owner.email : ctx.email || '') : (ctx.phone || '');

  // Reservar la llave única primero: si ya existe, no se vuelve a enviar.
  const base = {
    userId: owner.id, automationId: auto.id, dedupeKey: ctx.dedupe, channel: auto.channel,
    toAddr, subject, body, appointmentId: ctx.appointmentId ?? null, patientName: ctx.patientName,
  };
  const reserved = await db.insert(messageLog).values({ ...base, status: 'queued' })
    .onConflictDoNothing().returning({ id: messageLog.id });
  if (!reserved.length) return;
  const logId = reserved[0].id;
  const finish = (set: Partial<typeof messageLog.$inferInsert>) =>
    db.update(messageLog).set(set).where(eq(messageLog.id, logId));

  if (!toAddr) {
    await finish({ status: 'skipped', error: auto.channel === 'email' ? 'El paciente no dejó correo.' : 'Sin teléfono.' });
    return;
  }

  if (auto.channel === 'whatsapp') {
    const link = toDoctor ? null : waLink(toAddr, body);
    if (!link) { await finish({ status: 'skipped', error: 'WhatsApp solo se envía a pacientes con teléfono válido.' }); return; }
    await finish({ status: 'manual', link });
    return;
  }

  const r = await sendEmail(owner.id, toAddr, subject || '(sin asunto)', body);
  await finish(r.ok ? { status: 'sent', sentAt: new Date() } : { status: 'failed', error: r.error });
}

/** Reintenta un correo fallido desde la bitácora. */
export async function resendLog(logId: number, userId: string): Promise<boolean> {
  const [row] = await db.select().from(messageLog).where(and(eq(messageLog.id, logId), eq(messageLog.userId, userId))).limit(1);
  if (!row || row.channel !== 'email' || row.status !== 'failed') return false;
  const r = await sendEmail(userId, row.toAddr, row.subject || '(sin asunto)', row.body);
  await db.update(messageLog).set(r.ok ? { status: 'sent', sentAt: new Date(), error: null } : { error: r.error }).where(eq(messageLog.id, logId));
  return r.ok;
}

async function apptVars(apptId: number): Promise<{ appt: typeof appointments.$inferSelect; vars: Record<string, string> } | null> {
  const [row] = await db.select({
    a: appointments, doctorName: doctors.name, serviceTitle: services.titleEs,
  }).from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(eq(appointments.id, apptId)).limit(1);
  if (!row) return null;
  return { appt: row.a, vars: await baseVars({
    paciente: row.a.patientName, fecha: longDate(row.a.date), hora: hhmm12(row.a.time),
    servicio: row.serviceTitle ?? 'Consulta', doctora: row.doctorName ?? '',
  }) };
}

async function baseVars(extra: Record<string, string>): Promise<Record<string, string>> {
  const cfg = await getConfig();
  const site = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');
  return {
    clinica: 'Happy Dent', telefono: cfg.phone || '', direccion: cfg.address || '',
    agendar: site ? `${site}/agendar` : '', opinion: '', ...extra,
  };
}

function inScope(owner: Owner, doctorId: number | null): boolean {
  return owner.role === 'super_admin' || (owner.doctorId != null && owner.doctorId === doctorId);
}

/** Disparadores por evento: se llama al crear/confirmar/cancelar una cita. */
export async function fireAppointmentEvent(trigger: string, apptId: number): Promise<void> {
  try {
    await ensureCommsTables();
    const autos = await db.select().from(automations).where(and(eq(automations.trigger, trigger), eq(automations.enabled, true)));
    if (!autos.length) return;
    const data = await apptVars(apptId);
    if (!data) return;
    for (const auto of autos) {
      const owner = await getOwner(auto.userId);
      if (!owner || !inScope(owner, data.appt.doctorId)) continue;
      await deliver(auto, owner, {
        dedupe: `a${auto.id}:ap${apptId}`, vars: data.vars, patientName: data.appt.patientName,
        email: data.appt.email, phone: data.appt.phone, appointmentId: apptId,
      }).catch((e) => console.error('[comms] deliver', e));
    }
  } catch (e) {
    console.error('[comms] fireAppointmentEvent', e);
  }
}

/** Revisión periódica (cada minuto): recordatorios, seguimientos y cumpleaños. */
export async function tick(): Promise<{ checked: number }> {
  await ensureCommsTables();
  const autos = await db.select().from(automations).where(and(
    eq(automations.enabled, true),
    inArray(automations.trigger, ['reminder_before', 'followup_after', 'birthday']),
  ));
  if (!autos.length) return { checked: 0 };

  const nowMs = Date.now();
  const today = nowCancun();
  const owners = new Map<string, Owner | null>();

  for (const auto of autos) {
    if (!owners.has(auto.userId)) owners.set(auto.userId, await getOwner(auto.userId));
    const owner = owners.get(auto.userId);
    if (!owner) continue;

    try {
      if (auto.trigger === 'birthday') {
        if (today.hour < 9) continue;
        const md = today.date.slice(5);
        const list = await db.select().from(patients).where(isNotNull(patients.birthdate));
        for (const p of list) {
          if (!p.birthdate || p.birthdate.slice(5) !== md) continue;
          if (owner.role !== 'super_admin' && p.doctorId !== owner.doctorId) continue;
          await deliver(auto, owner, {
            dedupe: `a${auto.id}:b${p.id}:${today.date.slice(0, 4)}`,
            vars: await baseVars({ paciente: p.name, fecha: '', hora: '', servicio: '', doctora: owner.name }),
            patientName: p.name, email: p.email, phone: p.phone,
          });
        }
        continue;
      }

      const before = auto.trigger === 'reminder_before';
      const from = before ? today.date : addDays(today.date, -8);
      const to = before ? addDays(today.date, Math.ceil(auto.offsetMin / 1440) + 1) : today.date;
      const statuses = before ? ['confirmed'] : ['confirmed', 'done'];
      const rows = await db.select().from(appointments).where(and(
        gte(appointments.date, from), lte(appointments.date, to), inArray(appointments.status, statuses),
      )).orderBy(desc(appointments.date));

      for (const a of rows) {
        if (!inScope(owner, a.doctorId)) continue;
        const start = apptInstant(a.date, a.time);
        const due = before ? start - auto.offsetMin * MIN : start + auto.offsetMin * MIN;
        const ok = before ? nowMs >= due && nowMs < start : nowMs >= due && nowMs < due + 7 * 24 * 60 * MIN;
        if (!ok) continue;
        const data = await apptVars(a.id);
        if (!data) continue;
        await deliver(auto, owner, {
          dedupe: `a${auto.id}:ap${a.id}`, vars: data.vars, patientName: a.patientName,
          email: a.email, phone: a.phone, appointmentId: a.id,
        });
      }
    } catch (e) {
      console.error('[comms] tick automation', auto.id, e);
    }
  }
  return { checked: autos.length };
}
