import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { services } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '../../../lib/slug';

export const prerender = false;

function parseList(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const action = String(form.get('_action') || 'save');
  const id = form.get('id') ? Number(form.get('id')) : null;

  if (action === 'delete' && id) {
    await db.delete(services).where(eq(services.id, id));
    return new Response(null, { status: 303, headers: { Location: '/admin/servicios' } });
  }

  const titleEs = String(form.get('titleEs') || '').trim();
  if (!titleEs) return new Response('Título requerido', { status: 400 });

  const priceRaw = String(form.get('priceAmount') || '').trim();

  const data = {
    titleEs,
    titleEn: String(form.get('titleEn') || ''),
    descEs: String(form.get('descEs') || ''),
    descEn: String(form.get('descEn') || ''),
    icon: String(form.get('icon') || '') || null,
    photoUrl: String(form.get('photoUrl') || '') || null,
    featuresEs: parseList(String(form.get('featuresEs') || '')),
    featuresEn: parseList(String(form.get('featuresEn') || '')),
    category: String(form.get('category') || '') || null,
    priceAmount: priceRaw ? Number(priceRaw) : null,
    currency: String(form.get('currency') || 'MXN'),
    showPrice: form.get('showPrice') === 'on',
    durationMin: Number(form.get('durationMin') || 30),
    order: Number(form.get('order') || 0),
    active: form.get('active') === 'on',
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(services).set(data).where(eq(services.id, id));
  } else {
    await db.insert(services).values({ ...data, slug: `${slugify(titleEs)}-${Date.now().toString(36)}` });
  }
  return new Response(null, { status: 303, headers: { Location: '/admin/servicios' } });
};
