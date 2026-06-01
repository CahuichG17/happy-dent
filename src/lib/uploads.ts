import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join, extname } from 'node:path';

// Directorio persistente de subidas.
// En Railway montar un Volume y setear UPLOAD_DIR=/data/uploads.
// En local cae en ./uploads (gitignored).
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

export type SaveResult = { ok: true; url: string } | { ok: false; error: string };

export async function saveUpload(file: File): Promise<SaveResult> {
  if (!file || typeof file.arrayBuffer !== 'function') {
    return { ok: false, error: 'Archivo inválido' };
  }
  if (file.size === 0) return { ok: false, error: 'Archivo vacío' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'La imagen supera 6 MB' };

  const ext = extname(file.name || '').toLowerCase();
  if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: 'Formato no permitido (usa JPG, PNG, WebP, GIF o AVIF)' };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, name), buffer);

  return { ok: true, url: `/uploads/${name}` };
}

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

export function mimeForExt(ext: string): string {
  return MIME_BY_EXT[ext.toLowerCase()] || 'application/octet-stream';
}
