import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { db } from '../../../db';
import { reviewTokens } from '../../../db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });

  const form = await request.formData();
  const doctorId = form.get('doctorId') ? Number(form.get('doctorId')) : null;
  const patientName = (form.get('patientName') as string || '').trim();
  const patientId = form.get('patientId') ? Number(form.get('patientId')) : null;
  const appointmentId = form.get('appointmentId') ? Number(form.get('appointmentId')) : null;

  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(reviewTokens).values({
    token,
    doctorId: doctorId || null,
    patientName: patientName || '',
    patientId: patientId || null,
    appointmentId: appointmentId || null,
    expiresAt,
  });

  return new Response(null, {
    status: 303,
    headers: { Location: `/admin/opiniones/${token}` },
  });
};
