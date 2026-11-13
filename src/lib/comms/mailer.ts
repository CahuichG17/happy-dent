// SMTP por usuario. Cada doctora configura su propia cuenta; los correos salen
// con su nombre y su dirección. Si no tiene cuenta propia se usa el SMTP global
// opcional (variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
import nodemailer from 'nodemailer';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { mailAccounts } from '../../db/schema';
import { decryptSecret, encryptSecret } from '../crypto';
import { ensureCommsTables } from './ddl';

export type MailAccount = typeof mailAccounts.$inferSelect;

export const SMTP_PRESETS: Record<string, { label: string; host: string; port: number; secure: boolean; hint: string }> = {
  gmail: { label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: 465, secure: true, hint: 'Usa una "contraseña de aplicación" (requiere verificación en 2 pasos), no tu contraseña normal.' },
  outlook: { label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587, secure: false, hint: 'Puerto 587 con STARTTLS. Puede requerir habilitar SMTP autenticado en tu cuenta.' },
  zoho: { label: 'Zoho Mail', host: 'smtp.zoho.com', port: 465, secure: true, hint: 'Usa una contraseña de aplicación de Zoho.' },
  hostinger: { label: 'Hostinger', host: 'smtp.hostinger.com', port: 465, secure: true, hint: 'Usuario = tu correo completo.' },
  custom: { label: 'Otro (manual)', host: '', port: 465, secure: true, hint: 'Pide los datos SMTP a tu proveedor de correo.' },
};

export async function getMailAccount(userId: string): Promise<MailAccount | null> {
  await ensureCommsTables();
  const [row] = await db.select().from(mailAccounts).where(eq(mailAccounts.userId, userId)).limit(1);
  return row ?? null;
}

export type MailInput = {
  host: string; port: number; secure: boolean; username: string;
  password?: string; // vacío = conservar la actual
  fromName: string; fromEmail: string; replyTo?: string | null; signature?: string; enabled?: boolean;
};

export async function saveMailAccount(userId: string, input: MailInput): Promise<void> {
  await ensureCommsTables();
  const existing = await getMailAccount(userId);
  let passwordEnc = existing?.passwordEnc;
  if (input.password) passwordEnc = encryptSecret(input.password);
  if (!passwordEnc) throw new Error('La contraseña es obligatoria la primera vez.');
  const values = {
    userId,
    host: input.host.trim(),
    port: input.port,
    secure: input.secure,
    username: input.username.trim(),
    passwordEnc,
    fromName: input.fromName.trim(),
    fromEmail: input.fromEmail.trim(),
    replyTo: input.replyTo?.trim() || null,
    signature: input.signature ?? '',
    enabled: input.enabled ?? true,
    updatedAt: new Date(),
  };
  await db.insert(mailAccounts).values(values).onConflictDoUpdate({ target: mailAccounts.userId, set: values });
}

type Transport = { transporter: nodemailer.Transporter; from: string; replyTo?: string; signature: string };

async function buildTransport(userId: string): Promise<Transport | null> {
  const acc = await getMailAccount(userId);
  if (acc && acc.enabled) {
    return {
      transporter: nodemailer.createTransport({
        host: acc.host, port: acc.port, secure: acc.secure,
        auth: { user: acc.username, pass: decryptSecret(acc.passwordEnc) },
        connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
      }),
      from: acc.fromName ? `"${acc.fromName.replace(/"/g, '')}" <${acc.fromEmail}>` : acc.fromEmail,
      replyTo: acc.replyTo || undefined,
      signature: acc.signature,
    };
  }
  const host = process.env.SMTP_HOST;
  if (host && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT || 465);
    return {
      transporter: nodemailer.createTransport({
        host, port, secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
      }),
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      signature: '',
    };
  }
  return null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Convierte texto plano en un correo HTML sencillo con la marca de la clínica. */
export function renderEmailHtml(body: string, signature: string): string {
  const paras = esc(body).split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;">${p.replace(/\n/g, '<br>')}</p>`).join('');
  const sig = signature ? `<p style="margin:22px 0 0;color:#75626F;font-size:14px;">${esc(signature).replace(/\n/g, '<br>')}</p>` : '';
  return `<!doctype html><html><body style="margin:0;background:#FBF6F0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eadfd3;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#2B1E2A;line-height:1.6;font-size:15px;">
<div style="background:#B23A67;color:#fff;padding:16px 24px;font-size:18px;font-weight:bold;">Happy Dent</div>
<div style="padding:24px;">${paras}${sig}</div></div></body></html>`;
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(userId: string, to: string, subject: string, body: string): Promise<SendResult> {
  try {
    const t = await buildTransport(userId);
    if (!t) return { ok: false, error: 'No hay una cuenta de correo configurada para este usuario.' };
    const text = t.signature ? `${body}\n\n${t.signature}` : body;
    await t.transporter.sendMail({
      from: t.from, to, subject, text, html: renderEmailHtml(body, t.signature), replyTo: t.replyTo,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Verifica la conexión SMTP y envía un correo de prueba al propio usuario. */
export async function testMailAccount(userId: string, toEmail: string): Promise<SendResult> {
  const acc = await getMailAccount(userId);
  const r = await sendEmail(userId, toEmail, 'Prueba de correo — Happy Dent', 'Este es un correo de prueba.\n\nSi lo estás leyendo, tu cuenta SMTP quedó bien configurada y los mensajes automáticos saldrán desde aquí.');
  if (acc) {
    await db.update(mailAccounts).set({
      lastTestAt: new Date(), lastTestOk: r.ok, lastError: r.ok ? null : r.error,
    }).where(eq(mailAccounts.userId, userId));
  }
  return r;
}
