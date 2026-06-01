import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { videos } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const action = String(form.get('_action') || 'save');
  const id = form.get('id') ? Number(form.get('id')) : null;

  if (action === 'delete' && id) {
    await db.delete(videos).where(eq(videos.id, id));
    return new Response(null, { status: 303, headers: { Location: '/admin/videos' } });
  }

  const url = String(form.get('url') || '').trim();
  if (!url) return new Response('URL requerida', { status: 400 });

  const data = {
    title: String(form.get('title') || ''),
    url,
    platform: String(form.get('platform') || 'youtube'),
    thumb: String(form.get('thumb') || '') || null,
    order: Number(form.get('order') || 0),
    active: form.get('active') === 'on',
  };

  if (id) {
    await db.update(videos).set(data).where(eq(videos.id, id));
  } else {
    await db.insert(videos).values(data);
  }
  return new Response(null, { status: 303, headers: { Location: '/admin/videos' } });
};
