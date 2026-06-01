import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Conexión perezosa: no se crea hasta el primer uso real.
// Así el build/prerender del landing (que no consulta la DB) no requiere
// DATABASE_URL y nunca se rompe.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (_db) return _db;
  const connectionString =
    import.meta.env?.DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL no está definida. Configúrala en .env o en Railway.');
  }
  const client = postgres(connectionString, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

// Proxy que difiere la conexión hasta que se accede a un método/propiedad.
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const real = getDb();
    const value = (real as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

export { schema };
