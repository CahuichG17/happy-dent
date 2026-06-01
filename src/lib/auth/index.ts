import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../../db';

function createAuth() {
  // RAILWAY_PUBLIC_DOMAIN siempre gana sobre BETTER_AUTH_URL porque Railway
  // puede tener BETTER_AUTH_URL apuntando a localhost desde el .env local.
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
  const configuredURL = import.meta.env?.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || 'http://localhost:4321';
  const baseURL = railwayDomain ? `https://${railwayDomain}` : configuredURL;

  const trustedOrigins: string[] = ['http://localhost:4321', baseURL];
  if (configuredURL !== baseURL) trustedOrigins.push(configuredURL);

  return betterAuth({
    baseURL,
    trustedOrigins,
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
