import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { treatmentCases } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const CASE_STATUSES = ['active', 'completed', 'paused', 'cancelled'];

const str = (v: FormDataEntryValue | null) => {
  const s = (v == null ? '' : String(v)).trim();
  return s.length ? s : null;
};
const num = (v: FormDataEntryValue | null) => {
  const s = str(v);
  if (s == null) return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
};

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const action = String(form.get('_action') || 'save');
  const id = num(form.get('id'));
  const patientId = num(form.get('patientId'));
  const back = `/admin/pacientes/${patientId ?? ''}`;

  if (action === 'delete') {
    if (id) await db.delete(treatmentCases).where(eq(treatmentCases.id, id));
    return new Response(null, { status: 303, headers: { Location: back } });
  }

  if (action === 'status') {
    const status = String(form.get('status') || '');
    if (id && CASE_STATUSES.includes(status)) {
      await db.update(treatmentCases).set({ status, updatedAt: new Date() }).where(eq(treatmentCases.id, id));
    }
    return new Response(null, { status: 303, headers: { Location: back } });
  }

  const title = str(form.get('title'));
  if (!patientId || !title) return new Response('Faltan datos', { status: 400 });

  await db.insert(treatmentCases).values({
    patientId,
    title,
    doctorId: num(form.get('doctorId')),
    serviceId: num(form.get('serviceId')),
    plannedSessions: num(form.get('plannedSessions')) ?? 1,
    diagnosis: str(form.get('diagnosis')),
    plan: str(form.get('plan')),
    status: 'active',
  });

  return new Response(null, { status: 303, headers: { Location: back } });
};
