import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinicalSessions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const SESSION_STATUSES = ['planned', 'done', 'cancelled', 'no_show'];

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
    if (id) await db.delete(clinicalSessions).where(eq(clinicalSessions.id, id));
    return new Response(null, { status: 303, headers: { Location: back } });
  }

  if (action === 'status') {
    const status = String(form.get('status') || '');
    if (id && SESSION_STATUSES.includes(status)) {
      await db.update(clinicalSessions).set({ status, updatedAt: new Date() }).where(eq(clinicalSessions.id, id));
    }
    return new Response(null, { status: 303, headers: { Location: back } });
  }

  const caseId = num(form.get('caseId'));
  if (!patientId || !caseId) return new Response('Faltan datos', { status: 400 });

  await db.insert(clinicalSessions).values({
    caseId,
    patientId,
    doctorId: num(form.get('doctorId')),
    seq: num(form.get('seq')) ?? 1,
    date: str(form.get('date')),
    time: str(form.get('time')),
    procedure: str(form.get('procedure')),
    notes: str(form.get('notes')),
    status: 'planned',
  });

  return new Response(null, { status: 303, headers: { Location: back } });
};
