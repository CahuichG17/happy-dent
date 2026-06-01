import type { APIRoute } from 'astro';
import { auth } from '../../../lib/auth';
import { db } from '../../../db';
import { user } from '../../../db/auth-schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const ROLES = ['doctor', 'super_admin'];

export const POST: APIRoute = async ({ request, locals }) => {
  const form = await request.formData();
  const action = String(form.get('_action') || 'save');
  const id = form.get('id') ? String(form.get('id')) : null;

  if (action === 'delete' && id) {
    // No permitir que el super admin se elimine a sí mismo.
    if (locals.user?.id === id) {
      return new Response('No puedes eliminar tu propia cuenta', { status: 400 });
    }
    await db.delete(user).where(eq(user.id, id));
    return new Response(null, { status: 303, headers: { Location: '/admin/usuarios' } });
  }

  const name = String(form.get('name') || '').trim();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const role = ROLES.includes(String(form.get('role'))) ? String(form.get('role')) : 'doctor';
  const doctorIdRaw = form.get('doctorId');
  const doctorId = doctorIdRaw && String(doctorIdRaw) !== '' ? Number(doctorIdRaw) : null;

  if (!name || !email) {
    return new Response('Nombre y correo son obligatorios', { status: 400 });
  }

  if (id) {
    // Editar usuario existente: nombre, rol y doctora vinculada.
    await db.update(user).set({ name, role, doctorId, updatedAt: new Date() }).where(eq(user.id, id));
    return new Response(null, { status: 303, headers: { Location: '/admin/usuarios' } });
  }

  // Crear usuario nuevo: requiere contraseña.
  const password = String(form.get('password') || '');
  if (password.length < 8) {
    return new Response('La contraseña debe tener al menos 8 caracteres', { status: 400 });
  }

  try {
    await auth.api.signUpEmail({ body: { name, email, password } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No se pudo crear el usuario';
    return new Response(msg, { status: 400 });
  }

  await db.update(user).set({ role, doctorId }).where(eq(user.email, email));

  return new Response(null, { status: 303, headers: { Location: '/admin/usuarios' } });
};
