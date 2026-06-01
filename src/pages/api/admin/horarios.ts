import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { schedules } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const action = String(form.get('_action') || 'add');

  if (action === 'delete') {
    const id = form.get('id') ? Number(form.get('id')) : null;
    if (!id) return new Response('Falta el id', { status: 400 });
    await db.delete(schedules).where(eq(schedules.id, id));
    return new Response(null, { status: 303, headers: { Location: '/admin/horarios' } });
  }

  const doctorId = Number(form.get('doctorId'));
  const weekday = Number(form.get('weekday'));
  const startTime = String(form.get('startTime') || '');
  const endTime = String(form.get('endTime') || '');
  const slotMin = Number(form.get('slotMin') || 30);

  if (!doctorId || Number.isNaN(weekday) || !startTime || !endTime) {
    return new Response('Datos incompletos', { status: 400 });
  }
  if (endTime <= startTime) {
    return new Response('La hora de fin debe ser mayor que la de inicio', { status: 400 });
  }

  await db.insert(schedules).values({ doctorId, weekday, startTime, endTime, slotMin, active: true });

  return new Response(null, { status: 303, headers: { Location: '/admin/horarios' } });
};
