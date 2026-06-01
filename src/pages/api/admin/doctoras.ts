import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { doctors } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '../../../lib/slug';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const action = String(form.get('_action') || 'save');
  const id = form.get('id') ? Number(form.get('id')) : null;

  if (action === 'delete' && id) {
    await db.delete(doctors).where(eq(doctors.id, id));
    return new Response(null, { status: 303, headers: { Location: '/admin/doctoras' } });
  }

  const name = String(form.get('name') || '').trim();
  if (!name) {
    return new Response('Nombre requerido', { status: 400 });
  }

  const data = {
    name,
    specEs: String(form.get('specEs') || ''),
    specEn: String(form.get('specEn') || ''),
    bioEs: String(form.get('bioEs') || ''),
    bioEn: String(form.get('bioEn') || ''),
    initials: String(form.get('initials') || '').trim().toUpperCase().slice(0, 3),
    photoUrl: String(form.get('photoUrl') || '') || null,
    order: Number(form.get('order') || 0),
    active: form.get('active') === 'on',
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(doctors).set(data).where(eq(doctors.id, id));
  } else {
    await db.insert(doctors).values({ ...data, slug: `${slugify(name)}-${Date.now().toString(36)}` });
  }

  return new Response(null, { status: 303, headers: { Location: '/admin/doctoras' } });
};
