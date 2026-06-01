import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { testimonials } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const action = String(form.get('_action') || 'save');
  const id = form.get('id') ? Number(form.get('id')) : null;

  if (action === 'delete' && id) {
    await db.delete(testimonials).where(eq(testimonials.id, id));
    return new Response(null, { status: 303, headers: { Location: '/admin/testimonios' } });
  }

  const name = String(form.get('name') || '').trim();
  if (!name) return new Response('Nombre requerido', { status: 400 });

  const data = {
    name,
    roleEs: String(form.get('roleEs') || ''),
    roleEn: String(form.get('roleEn') || ''),
    textEs: String(form.get('textEs') || ''),
    textEn: String(form.get('textEn') || ''),
    rating: Math.min(5, Math.max(1, Number(form.get('rating') || 5))),
    avatar: String(form.get('avatar') || '') || null,
    approved: form.get('approved') === 'on',
    order: Number(form.get('order') || 0),
  };

  if (id) {
    await db.update(testimonials).set(data).where(eq(testimonials.id, id));
  } else {
    await db.insert(testimonials).values(data);
  }
  return new Response(null, { status: 303, headers: { Location: '/admin/testimonios' } });
};
