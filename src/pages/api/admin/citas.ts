import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { appointments } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const STATUSES = ['pending', 'confirmed', 'cancelled', 'done'];

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const action = String(form.get('_action') || 'status');
  const id = form.get('id') ? Number(form.get('id')) : null;
  if (!id) return new Response('Falta el id', { status: 400 });

  if (action === 'delete') {
    await db.delete(appointments).where(eq(appointments.id, id));
    return new Response(null, { status: 303, headers: { Location: '/admin/citas' } });
  }

  const status = String(form.get('status') || '');
  if (!STATUSES.includes(status)) return new Response('Estado inválido', { status: 400 });

  await db.update(appointments).set({ status, updatedAt: new Date() }).where(eq(appointments.id, id));
  return new Response(null, { status: 303, headers: { Location: '/admin/citas' } });
};
