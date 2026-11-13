import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { appointments } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { doctorScope } from '../../../lib/scope';
import { fireAppointmentEvent } from '../../../lib/comms/engine';

export const prerender = false;

const STATUSES = ['pending', 'confirmed', 'cancelled', 'done'];
const EVENT_BY_STATUS: Record<string, string> = {
  confirmed: 'appointment_confirmed',
  cancelled: 'appointment_cancelled',
};

export const POST: APIRoute = async ({ request, locals }) => {
  const form = await request.formData();
  const action = String(form.get('_action') || 'status');
  const id = form.get('id') ? Number(form.get('id')) : null;
  if (!id) return new Response('Falta el id', { status: 400 });

  // Volver a la pantalla de origen (solo rutas internas del admin).
  const back = String(form.get('redirect') || '');
  const location = back.startsWith('/admin') ? back : '/admin/citas';

  // Cada doctora solo puede tocar sus propias citas.
  const scope = doctorScope(locals.user);
  const [appt] = await db.select({ doctorId: appointments.doctorId }).from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!appt) return new Response('Cita no encontrada', { status: 404 });
  if (scope !== null && appt.doctorId !== scope) return new Response('No autorizado', { status: 403 });

  if (action === 'delete') {
    await db.delete(appointments).where(eq(appointments.id, id));
    return new Response(null, { status: 303, headers: { Location: location } });
  }

  const status = String(form.get('status') || '');
  if (!STATUSES.includes(status)) return new Response('Estado inválido', { status: 400 });

  await db.update(appointments).set({ status, updatedAt: new Date() }).where(eq(appointments.id, id));
  const event = EVENT_BY_STATUS[status];
  if (event) void fireAppointmentEvent(event, id);
  return new Response(null, { status: 303, headers: { Location: location } });
};
