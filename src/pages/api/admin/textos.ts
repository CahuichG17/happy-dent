import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { siteSettings } from '../../../db/schema';
import { COPY_SCHEMA, type CopyMap } from '../../../lib/copy';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const value: CopyMap = {};

  for (const group of COPY_SCHEMA) {
    for (const item of group.items) {
      const es = (form.get(`${item.key}__es`) ?? item.es).toString();
      const en = (form.get(`${item.key}__en`) ?? item.en).toString();
      value[item.key] = { es, en };
    }
  }

  await db
    .insert(siteSettings)
    .values({ key: 'copy', value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: new Date() },
    });

  return new Response(null, { status: 303, headers: { Location: '/admin/textos?ok=1' } });
};
