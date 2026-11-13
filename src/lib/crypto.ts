// Cifrado simétrico (AES-256-GCM) para secretos guardados en la DB (ej. contraseña SMTP).
// La llave sale de MAIL_ENCRYPTION_KEY o, si no existe, de BETTER_AUTH_SECRET.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function key(): Buffer {
  const secret = process.env.MAIL_ENCRYPTION_KEY || import.meta.env?.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('Falta MAIL_ENCRYPTION_KEY o BETTER_AUTH_SECRET para cifrar la contraseña.');
  return createHash('sha256').update(String(secret)).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function decryptSecret(token: string): string {
  const [iv, tag, enc] = token.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}
