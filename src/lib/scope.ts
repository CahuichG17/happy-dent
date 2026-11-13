// Alcance de datos por usuario: cada doctora solo ve lo suyo; el super admin ve todo
// (y puede filtrar por doctora).
type U = { role?: string; doctorId?: number | null } | undefined | null;

/** null = sin filtro (todas). -1 = nada (usuario sin doctora vinculada). */
export function doctorScope(user: U, requested?: number | null): number | null {
  if (user?.role === 'super_admin') return requested && requested > 0 ? requested : null;
  return user?.doctorId ?? -1;
}

export function isSuper(user: U): boolean {
  return user?.role === 'super_admin';
}
