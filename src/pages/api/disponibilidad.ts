import type { APIRoute } from 'astro';
import { getAvailability } from '../../lib/booking';

export const prerender = false;

// GET /api/disponibilidad?date=YYYY-MM-DD&serviceId=123
// Devuelve solo los horarios libres (sin revelar qué doctora).
export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get('date') || '';
  const serviceIdRaw = url.searchParams.get('serviceId');
  const serviceId = serviceIdRaw ? Number(serviceIdRaw) : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response(JSON.stringify({ error: 'Fecha inválida' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { times } = await getAvailability(date, serviceId);
  return new Response(JSON.stringify({ date, times }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
