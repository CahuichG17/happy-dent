// Crea (si no existen) las tablas de comunicación. Es idempotente, así no
// dependemos de correr migraciones a mano en Railway.
import { sql } from 'drizzle-orm';
import { db } from '../../db';

let done: Promise<void> | null = null;

export function ensureCommsTables(): Promise<void> {
  if (!done) {
    done = (async () => {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS mail_accounts (
        user_id text PRIMARY KEY, host text NOT NULL, port integer NOT NULL DEFAULT 465,
        secure boolean NOT NULL DEFAULT true, username text NOT NULL, password_enc text NOT NULL,
        from_name text NOT NULL DEFAULT '', from_email text NOT NULL, reply_to text,
        signature text NOT NULL DEFAULT '', enabled boolean NOT NULL DEFAULT true,
        last_test_at timestamptz, last_test_ok boolean, last_error text,
        updated_at timestamptz NOT NULL DEFAULT now())`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS message_templates (
        id serial PRIMARY KEY, user_id text NOT NULL, name text NOT NULL,
        channel text NOT NULL DEFAULT 'email', subject text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS automations (
        id serial PRIMARY KEY, user_id text NOT NULL, name text NOT NULL, trigger text NOT NULL,
        channel text NOT NULL DEFAULT 'email', recipient text NOT NULL DEFAULT 'patient',
        template_id integer REFERENCES message_templates(id) ON DELETE SET NULL,
        offset_min integer NOT NULL DEFAULT 0, enabled boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now())`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS message_log (
        id serial PRIMARY KEY, user_id text NOT NULL,
        automation_id integer REFERENCES automations(id) ON DELETE SET NULL,
        dedupe_key text UNIQUE, channel text NOT NULL, to_addr text NOT NULL DEFAULT '',
        subject text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '', link text,
        status text NOT NULL, error text, appointment_id integer, patient_name text,
        created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz)`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS calendar_tokens (
        user_id text PRIMARY KEY, token text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now())`);
    })().catch((e) => {
      done = null; // reintentar en la siguiente llamada
      throw e;
    });
  }
  return done;
}
