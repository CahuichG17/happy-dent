import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { attachments } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const KINDS = ['xray', 'photo', 'doc'];

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
    if (id) await db.delete(attachments).where(eq(attachments.id, id));
    return new Response(null, { status: 303, headers: { Location: back } });
  }

  const url = str(form.get('url'));
  if (!patientId || !url) return new Response('Falta el archivo', { status: 400 });

  const kind = String(form.get('kind') || 'photo');
  await db.insert(attachments).values({
    patientId,
    caseId: num(form.get('caseId')),
    sessionId: num(form.get('sessionId')),
    url,
    kind: KINDS.includes(kind) ? kind : 'photo',
    label: str(form.get('label')),
  });

  return new Response(null, { status: 303, headers: { Location: back } });
};
