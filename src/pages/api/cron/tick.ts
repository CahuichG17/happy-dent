// Disparo externo opcional del planificador (por si prefieres un cron de Railway
// o cron-job.org). Requiere CRON_SECRET: /api/cron/tick?key=...
import type { APIRoute } from 'astro';
import { tick } from '../../../lib/comms/engine';

export const prerender = false;

export const GET: APIRoute = async ({ url, request }) => {
  const secret = process.env.CRON_SECRET;
  const key = url.searchParams.get('key') || request.headers.get('x-cron-key');
  if (!secret || key !== secret) return new Response('No autorizado', { status: 401 });
  const r = await tick();
  return new Response(JSON.stringify({ ok: true, ...r }), { headers: { 'Content-Type': 'application/json' } });
};
