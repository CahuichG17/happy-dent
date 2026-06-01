import 'dotenv/config';
import { auth } from '../lib/auth';
import { db } from './index';
import { user } from './auth-schema';
import { eq } from 'drizzle-orm';

// Uso:
//   tsx src/db/create-admin.ts "Nombre" correo@dominio.com "contraseñaSegura"
async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.error('Uso: tsx src/db/create-admin.ts "Nombre" correo@dominio.com "contraseña"');
    process.exit(1);
  }

  await auth.api.signUpEmail({
    body: { name, email, password },
  });

  await db.update(user).set({ role: 'super_admin' }).where(eq(user.email, email));

  console.log(`✅ Super admin creado: ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error creando admin:', err);
  process.exit(1);
});
