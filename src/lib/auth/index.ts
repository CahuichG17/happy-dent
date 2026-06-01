import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../../db';

function createAuth() {
  return betterAuth({
    baseURL: import.meta.env?.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL ||
      (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'http://localhost:4321'),
    trustedOrigins: [
      'http://localhost:4321',
      ...(process.env.RAILWAY_PUBLIC_DOMAIN ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`] : []),
      ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ],
    secret: import.meta.env?.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: 'pg' }),
    emailAndPassword: {
      enabled: true,
      // Las cuentas las crea el super admin; no hay registro público.
      disableSignUp: false,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'doctor',
          input: false, // no se puede setear desde el cliente
        },
        doctorId: {
          type: 'number',
          required: false,
          input: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 días
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
  });
}

// Inicialización perezosa: betterAuth() no se construye hasta el primer uso,
// evitando que el prerender del landing lo evalúe (y exija el secret).
let _auth: ReturnType<typeof createAuth> | null = null;

export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, prop) {
    if (!_auth) _auth = createAuth();
    const value = (_auth as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(_auth) : value;
  },
});

export type Session = ReturnType<typeof createAuth>['$Infer']['Session'];
