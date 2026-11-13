// Feed de calendario (.ics) por usuario. Se suscribe desde Google Calendar,
// Apple Calendar u Outlook con la URL secreta. Sin sesión: la seguridad es el token.
import type { APIRoute } from 'astro';
import { and, asc, eq, gte, lte, ne } from 'drizzle-orm';
import { db } from '../../../db';
import { appointments, calendarTokens, doctors, services, user } from '../../../db/schema';
import { ensureCommsTables } from '../../../lib/comms/ddl';
import { addDays, apptInstant, nowCancun } from '../../../lib/comms/time';

export const prerender = false;

const icsEsc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export const GET: APIRoute = async ({ params }) => {
  const token = String(params.token || '').replace(/\.ics$/i, '');
  if (!/^[a-f0-9]{48}$/.test(token)) return new Response('No encontrado', { status: 404 });

  await ensureCommsTables();
  const [row] = await db.select().from(calendarTokens).where(eq(calendarTokens.token, token)).limit(1);
  if (!row) return new Response('No encontrado', { status: 404 });
  const [owner] = await db.select({ role: user.role, doctorId: user.doctorId, name: user.name }).from(user).where(eq(user.id, row.userId)).limit(1);
  if (!owner) return new Response('No encontrado', { status: 404 });

  const today = nowCancun().date;
  const conds = [gte(appointments.date, addDays(today, -30)), lte(appointments.date, addDays(today, 365)), ne(appointments.status, 'cancelled')];
  if (owner.role !== 'super_admin') {
    if (owner.doctorId == null) return new Response('Sin doctora vinculada', { status: 404 });
    conds.push(eq(appointments.doctorId, owner.doctorId));
  }
  const rows = await db.select({
    a: appointments, doctorName: doctors.name, serviceTitle: services.titleEs, duration: services.durationMin,
  }).from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(and(...conds)).orderBy(asc(appointments.date), asc(appointments.time));

  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Happy Dent//Agenda//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:Happy Dent — ${icsEsc(owner.name)}`, 'X-WR-TIMEZONE:America/Cancun', 'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
  ];
  for (const r of rows) {
    const start = apptInstant(r.a.date, r.a.time);
    const end = start + (r.duration || 30) * 60_000;
    const desc = [`Teléfono: ${r.a.phone}`, r.a.email ? `Correo: ${r.a.email}` : '', r.serviceTitle ? `Servicio: ${r.serviceTitle}` : '',
      r.doctorName && owner.role === 'super_admin' ? `Doctora: ${r.doctorName}` : '', r.a.notes ? `Notas: ${r.a.notes}` : ''].filter(Boolean).join('\n');
    lines.push(
      'BEGIN:VEVENT', `UID:cita-${r.a.id}@happydent`, `DTSTAMP:${stamp(Date.now())}`,
      `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${icsEsc(`${r.a.status === 'pending' ? '(Pendiente) ' : ''}${r.a.patientName}${r.serviceTitle ? ' — ' + r.serviceTitle : ''}`)}`,
      `DESCRIPTION:${icsEsc(desc)}`, `STATUS:${r.a.status === 'pending' ? 'TENTATIVE' : 'CONFIRMED'}`, 'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');

  return new Response(lines.join('\r\n'), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=300' },
  });
};
