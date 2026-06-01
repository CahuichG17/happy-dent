import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { siteSettings } from '../../../db/schema';
import { SECTION_KEYS } from '../../../lib/content';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const value: Record<string, boolean> = {};
  for (const key of SECTION_KEYS) {
    value[key] = form.get(key) === 'on';
  }

  await db
    .insert(siteSettings)
    .values({ key: 'sections', value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: new Date() },
    });

  return new Response(null, { status: 303, headers: { Location: '/admin/secciones' } });
};
