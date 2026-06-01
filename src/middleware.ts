import { defineMiddleware } from 'astro:middleware';
import { auth } from './lib/auth';

// Rutas protegidas que requieren sesión.
const PROTECTED_PREFIXES = ['/admin', '/api/admin'];
// Rutas de /admin que NO requieren sesión (login).
const PUBLIC_ADMIN_PATHS = ['/admin/login'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return next();
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) return next();

  // Obtener sesión desde Better Auth.
  const session = await auth.api.getSession({ headers: context.request.headers });

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/admin/login');
  }

  // Exponer usuario a las páginas.
  context.locals.user = session.user as typeof context.locals.user;
  context.locals.session = session.session as typeof context.locals.session;

  // Rutas exclusivas de super admin.
  const role = (session.user as { role?: string }).role ?? 'doctor';
  const SUPER_ADMIN_ONLY = ['/admin/usuarios', '/admin/configuracion', '/api/admin/users'];
  const needsSuperAdmin = SUPER_ADMIN_ONLY.some((p) => pathname.startsWith(p));
  if (needsSuperAdmin && role !== 'super_admin') {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/admin');
  }

  return next();
});
