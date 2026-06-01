import type { APIRoute } from 'astro';
import { db } from '../../db';
import { reviewTokens, testimonials, doctors } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const token = (form.get('token') as string || '').trim();
  const name = (form.get('name') as string || '').trim();
  const ratingRaw = Number(form.get('rating') || 5);
  const comment = (form.get('comment') as string || '').trim();

  if (!token) return new Response('Token requerido', { status: 400 });
  if (!name || !comment) {
    return new Response(null, {
      status: 303,
      headers: { Location: `/opinar/${token}?error=campos` },
    });
  }

  const rating = Math.min(5, Math.max(1, Number.isNaN(ratingRaw) ? 5 : ratingRaw));

  const rows = await db
    .select({ t: reviewTokens, doctorName: doctors.name })
    .from(reviewTokens)
    .leftJoin(doctors, eq(reviewTokens.doctorId, doctors.id))
    .where(eq(reviewTokens.token, token))
    .limit(1);

  const row = rows[0];
  if (!row) return new Response('Token inválido', { status: 404 });

  if (row.t.usedAt) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/opinar/gracias?ya=1' },
    });
  }

  if (new Date(row.t.expiresAt) < new Date()) {
    return new Response(null, {
      status: 303,
      headers: { Location: `/opinar/${token}?error=expirado` },
    });
  }

  const roleEs = row.doctorName ? `Paciente de ${row.doctorName}` : 'Paciente verificado';
  const roleEn = row.doctorName ? `Patient of ${row.doctorName}` : 'Verified patient';

  await db.insert(testimonials).values({
    name,
    roleEs,
    roleEn,
    textEs: comment,
    textEn: comment,
    rating,
    approved: false,
    order: 0,
  });

  await db
    .update(reviewTokens)
    .set({ usedAt: new Date() })
    .where(eq(reviewTokens.token, token));

  return new Response(null, {
    status: 303,
    headers: { Location: '/opinar/gracias' },
  });
};
