import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { faqs } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const action = String(form.get('_action') || 'save');
  const id = form.get('id') ? Number(form.get('id')) : null;

  if (action === 'delete' && id) {
    await db.delete(faqs).where(eq(faqs.id, id));
    return new Response(null, { status: 303, headers: { Location: '/admin/faq' } });
  }

  const qEs = String(form.get('qEs') || '').trim();
  if (!qEs) return new Response('Pregunta requerida', { status: 400 });

  const data = {
    qEs,
    qEn: String(form.get('qEn') || ''),
    aEs: String(form.get('aEs') || ''),
    aEn: String(form.get('aEn') || ''),
    order: Number(form.get('order') || 0),
    active: form.get('active') === 'on',
  };

  if (id) {
    await db.update(faqs).set(data).where(eq(faqs.id, id));
  } else {
    await db.insert(faqs).values(data);
  }
  return new Response(null, { status: 303, headers: { Location: '/admin/faq' } });
};
