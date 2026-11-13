// Acciones del módulo de comunicación (correo, plantillas, automatizaciones,
// bitácora y calendario). Todo está limitado al usuario con sesión.
import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { automations, calendarTokens, mailAccounts, messageLog, messageTemplates } from '../../../db/schema';
import { ensureCommsTables } from '../../../lib/comms/ddl';
import { resendLog, ensureDefaults } from '../../../lib/comms/engine';
import { getMailAccount, saveMailAccount, testMailAccount } from '../../../lib/comms/mailer';
import { TRIGGERS } from '../../../lib/comms/templates';

export const prerender = false;

const CHANNELS = ['email', 'whatsapp'];

export const POST: APIRoute = async ({ request, locals }) => {
  const me = locals.user;
  if (!me) return new Response('No autenticado', { status: 401 });
  await ensureCommsTables();

  const f = await request.formData();
  const action = String(f.get('_action') || '');
  const back = String(f.get('redirect') || '');
  const dest = back.startsWith('/admin') ? back : '/admin/automatizaciones';
  const go = (msg: string, kind: 'ok' | 'err' = 'ok') => {
    const u = new URL(dest, 'http://x');
    u.searchParams.set(kind === 'ok' ? 'ok' : 'err', msg);
    return new Response(null, { status: 303, headers: { Location: u.pathname + u.search } });
  };
  const str = (k: string) => String(f.get(k) ?? '').trim();
  const num = (k: string) => (f.get(k) ? Number(f.get(k)) : null);
  const id = num('id');

  try {
    switch (action) {
      // ───────── Correo SMTP ─────────
      case 'mail_save': {
        const host = str('host'), username = str('username'), fromEmail = str('fromEmail');
        const port = Number(str('port')) || 465;
        if (!host || !username || !fromEmail) return go('Completa servidor, usuario y correo remitente.', 'err');
        if (!/^\S+@\S+\.\S+$/.test(fromEmail)) return go('El correo remitente no es válido.', 'err');
        await saveMailAccount(me.id, {
          host, port, secure: f.get('secure') === 'on', username, password: String(f.get('password') ?? ''),
          fromName: str('fromName'), fromEmail, replyTo: str('replyTo'), signature: String(f.get('signature') ?? '').trim(),
          enabled: f.get('enabled') === 'on',
        });
        return go('Cuenta de correo guardada. Envía un correo de prueba para verificarla.');
      }
      case 'mail_test': {
        const r = await testMailAccount(me.id, me.email);
        return r.ok ? go(`Correo de prueba enviado a ${me.email}.`) : go(`No se pudo enviar: ${r.error}`, 'err');
      }
      case 'mail_delete': {
        await db.delete(mailAccounts).where(eq(mailAccounts.userId, me.id));
        return go('Cuenta de correo eliminada.');
      }

      // ───────── Plantillas ─────────
      case 'tpl_save': {
        const name = str('name');
        const channel = CHANNELS.includes(str('channel')) ? str('channel') : 'email';
        if (!name || !str('body')) return go('La plantilla necesita nombre y mensaje.', 'err');
        const values = { name, channel, subject: str('subject'), body: String(f.get('body') ?? '').trim(), updatedAt: new Date() };
        if (id) await db.update(messageTemplates).set(values).where(and(eq(messageTemplates.id, id), eq(messageTemplates.userId, me.id)));
        else await db.insert(messageTemplates).values({ ...values, userId: me.id });
        return go('Plantilla guardada.');
      }
      case 'tpl_delete': {
        if (id) await db.delete(messageTemplates).where(and(eq(messageTemplates.id, id), eq(messageTemplates.userId, me.id)));
        return go('Plantilla eliminada.');
      }

      // ───────── Automatizaciones ─────────
      case 'auto_save': {
        const trigger = str('trigger');
        const templateId = num('templateId');
        if (!TRIGGERS[trigger]) return go('Disparador inválido.', 'err');
        if (!str('name') || !templateId) return go('Ponle nombre y elige una plantilla.', 'err');
        const channel = CHANNELS.includes(str('channel')) ? str('channel') : 'email';
        const recipient = str('recipient') === 'doctor' ? 'doctor' : 'patient';
        const unit = Number(str('offsetUnit')) || 1; // minutos | horas(60) | días(1440)
        const offsetMin = TRIGGERS[trigger].timed ? Math.max(0, Math.round(Number(str('offsetValue')) * unit)) : 0;
        const values = { name: str('name'), trigger, channel, recipient, templateId, offsetMin };
        if (id) await db.update(automations).set(values).where(and(eq(automations.id, id), eq(automations.userId, me.id)));
        else await db.insert(automations).values({ ...values, userId: me.id, enabled: false });
        return go('Automatización guardada. Actívala cuando estés listo.');
      }
      case 'auto_toggle': {
        if (!id) return go('Falta el id.', 'err');
        const [a] = await db.select().from(automations).where(and(eq(automations.id, id), eq(automations.userId, me.id))).limit(1);
        if (!a) return go('No encontrada.', 'err');
        if (!a.enabled && a.channel === 'email') {
          const acc = await getMailAccount(me.id);
          if (!acc && !process.env.SMTP_HOST) return go('Primero configura tu correo en "Mi correo".', 'err');
        }
        await db.update(automations).set({ enabled: !a.enabled }).where(eq(automations.id, id));
        return go(a.enabled ? 'Automatización pausada.' : 'Automatización activada.');
      }
      case 'auto_delete': {
        if (id) await db.delete(automations).where(and(eq(automations.id, id), eq(automations.userId, me.id)));
        return go('Automatización eliminada.');
      }
      case 'defaults': {
        await ensureDefaults(me.id);
        return go('Listo: agregamos plantillas y automatizaciones sugeridas.');
      }

      // ───────── Bitácora ─────────
      case 'msg_done': {
        if (id) await db.update(messageLog).set({ status: 'manual_done', sentAt: new Date() })
          .where(and(eq(messageLog.id, id), eq(messageLog.userId, me.id), eq(messageLog.status, 'manual')));
        return go('Marcado como enviado.');
      }
      case 'msg_retry': {
        const ok = id ? await resendLog(id, me.id) : false;
        return ok ? go('Correo reenviado.') : go('No se pudo reenviar. Revisa tu configuración de correo.', 'err');
      }

      // ───────── Calendario (.ics) ─────────
      case 'cal_token': {
        const token = randomBytes(24).toString('hex');
        await db.insert(calendarTokens).values({ userId: me.id, token })
          .onConflictDoUpdate({ target: calendarTokens.userId, set: { token, createdAt: new Date() } });
        return go('Generamos un enlace nuevo. El anterior dejó de funcionar.');
      }
    }
  } catch (e) {
    console.error('[comms]', action, e);
    return go(e instanceof Error ? e.message : 'Ocurrió un error.', 'err');
  }
  return go('Acción no reconocida.', 'err');
};
