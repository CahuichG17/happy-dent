import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { siteSettings } from '../../../db/schema';
import { DEFAULT_CONFIG, type SiteConfig } from '../../../lib/content';

export const prerender = false;

const KEYS = Object.keys(DEFAULT_CONFIG) as (keyof SiteConfig)[];

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();

  const value = {} as Record<string, string>;
  for (const k of KEYS) {
    value[k] = String(form.get(k) ?? '').trim();
  }

  await db
    .insert(siteSettings)
    .values({ key: 'config', value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });

  return new Response(null, { status: 303, headers: { Location: '/admin/configuracion' } });
};
