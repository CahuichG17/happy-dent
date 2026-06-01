import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { patients } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

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

  if (action === 'delete') {
    if (id) await db.delete(patients).where(eq(patients.id, id));
    return new Response(null, { status: 303, headers: { Location: '/admin/pacientes' } });
  }

  const name = str(form.get('name'));
  if (!name) return new Response('Falta el nombre', { status: 400 });

  const values = {
    name,
    phone: str(form.get('phone')) ?? '',
    email: str(form.get('email')),
    birthdate: str(form.get('birthdate')),
    doctorId: num(form.get('doctorId')),
    medicalNotes: str(form.get('medicalNotes')),
    updatedAt: new Date(),
  };

  let targetId = id;
  if (id) {
    await db.update(patients).set(values).where(eq(patients.id, id));
  } else {
    const [created] = await db.insert(patients).values(values).returning({ id: patients.id });
    targetId = created.id;
  }

  return new Response(null, { status: 303, headers: { Location: `/admin/pacientes/${targetId}` } });
};
