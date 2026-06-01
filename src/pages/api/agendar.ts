import type { APIRoute } from 'astro';
import { db } from '../../db';
import { appointments } from '../../db/schema';
import { pickDoctorForSlot } from '../../lib/booking';

export const prerender = false;

// POST /api/agendar
// Crea una solicitud de cita en estado 'pending'. El sistema asigna
// doctora por disponibilidad (no la elige el paciente). Nunca se acepta
// sola: la doctora confirma manualmente desde el panel.
export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    body = await request.json();
  } else {
    body = Object.fromEntries(await request.formData());
  }

  const patientName = String(body.patientName ?? body.nombre ?? '').trim();
  const phone = String(body.phone ?? body.telefono ?? '').trim();
  const email = String(body.email ?? '').trim() || null;
  const date = String(body.date ?? body.fecha ?? '').trim();
  const time = String(body.time ?? body.hora ?? '').trim().slice(0, 5);
  const notes = String(body.notes ?? body.notas ?? '').trim() || null;
  const serviceId = body.serviceId ? Number(body.serviceId) : null;

  const fail = (msg: string, status = 400) =>
    new Response(JSON.stringify({ ok: false, error: msg }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  if (!patientName) return fail('El nombre es obligatorio');
  if (!phone) return fail('El teléfono es obligatorio');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Fecha inválida');
  if (!/^\d{2}:\d{2}$/.test(time)) return fail('Horario inválido');

  // No permitir fechas pasadas.
  const slot = new Date(`${date}T${time}:00`);
  if (Number.isNaN(slot.getTime()) || slot.getTime() < Date.now()) {
    return fail('Ese horario ya no está disponible');
  }

  // Asignar doctora por disponibilidad.
  const doctorId = await pickDoctorForSlot(date, time, serviceId);
  if (!doctorId) return fail('Ese horario acaba de ocuparse. Elige otro, por favor.', 409);

  try {
    await db.insert(appointments).values({
      patientName,
      phone,
      email,
      serviceId: serviceId ?? null,
      doctorId,
      date,
      time,
      status: 'pending',
      notes,
      updatedAt: new Date(),
    });
  } catch {
    // El índice único (doctora+fecha+hora) evita la doble reserva en carreras.
    return fail('Ese horario acaba de ocuparse. Elige otro, por favor.', 409);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
