import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: import.meta.env.PUBLIC_SITE_URL || undefined,
});

export const { signIn, signOut, useSession, getSession } = authClient;
