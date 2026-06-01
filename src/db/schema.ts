import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  time,
  date,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';

// Tablas de autenticación (Better Auth)
export { user, session, account, verification } from './auth-schema';

// ─────────────────────────────────────────────────────────────
// Doctoras
// ─────────────────────────────────────────────────────────────
export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  specEs: text('spec_es').notNull().default(''),
  specEn: text('spec_en').notNull().default(''),
  bioEs: text('bio_es').notNull().default(''),
  bioEn: text('bio_en').notNull().default(''),
  initials: text('initials').notNull().default(''),
  photoUrl: text('photo_url'),
  credentials: text('credentials'),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Servicios
// ─────────────────────────────────────────────────────────────
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  titleEs: text('title_es').notNull(),
  titleEn: text('title_en').notNull(),
  descEs: text('desc_es').notNull().default(''),
  descEn: text('desc_en').notNull().default(''),
  icon: text('icon'),
  photoUrl: text('photo_url'),
  featuresEs: jsonb('features_es').$type<string[]>().notNull().default([]),
  featuresEn: jsonb('features_en').$type<string[]>().notNull().default([]),
  category: text('category'),
  priceAmount: integer('price_amount'),
  currency: text('currency').notNull().default('MXN'),
  showPrice: boolean('show_price').notNull().default(false),
  durationMin: integer('duration_min').notNull().default(30),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relación N:M doctora ↔ servicio (quién hace qué)
export const doctorServices = pgTable(
  'doctor_services',
  {
    doctorId: integer('doctor_id')
      .notNull()
      .references(() => doctors.id, { onDelete: 'cascade' }),
    serviceId: integer('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.doctorId, t.serviceId] }),
  }),
);

// ─────────────────────────────────────────────────────────────
// Horarios por doctora (plantilla semanal)
// weekday: 0=Domingo … 6=Sábado
// ─────────────────────────────────────────────────────────────
export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  weekday: integer('weekday').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  slotMin: integer('slot_min').notNull().default(30),
  active: boolean('active').notNull().default(true),
});

// Excepciones de horario (cierres, días especiales)
export const scheduleExceptions = pgTable('schedule_exceptions', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  closed: boolean('closed').notNull().default(true),
  startTime: time('start_time'),
  endTime: time('end_time'),
  note: text('note'),
});

// ─────────────────────────────────────────────────────────────
// Citas (solicitud + confirmación manual)
// status: pending | confirmed | cancelled | done
// ─────────────────────────────────────────────────────────────
export const appointments = pgTable(
  'appointments',
  {
    id: serial('id').primaryKey(),
    patientName: text('patient_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    serviceId: integer('service_id').references(() => services.id, { onDelete: 'set null' }),
    doctorId: integer('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
    date: date('date').notNull(),
    time: time('time').notNull(),
    status: text('status').notNull().default('pending'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // Anti doble-cita: una doctora no puede tener dos citas en el mismo
    // día y hora. Se aplica a nivel de índice único.
    uniqSlot: uniqueIndex('appointments_doctor_slot_unique').on(t.doctorId, t.date, t.time),
  }),
);

// ─────────────────────────────────────────────────────────────
// Cotizaciones
// ─────────────────────────────────────────────────────────────
export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  patientName: text('patient_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  items: jsonb('items').$type<{ serviceId: number; title: string; qty: number }[]>().notNull().default([]),
  total: integer('total'),
  status: text('status').notNull().default('new'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Testimonios
// ─────────────────────────────────────────────────────────────
export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  roleEs: text('role_es').notNull().default(''),
  roleEn: text('role_en').notNull().default(''),
  textEs: text('text_es').notNull(),
  textEn: text('text_en').notNull(),
  rating: integer('rating').notNull().default(5),
  avatar: text('avatar'),
  approved: boolean('approved').notNull().default(true),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────
export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  qEs: text('q_es').notNull(),
  qEn: text('q_en').notNull(),
  aEs: text('a_es').notNull(),
  aEn: text('a_en').notNull(),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

// ─────────────────────────────────────────────────────────────
// Videos (enlaces embebidos FB/IG/YouTube)
// platform: youtube | facebook | instagram | vimeo
// ─────────────────────────────────────────────────────────────
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().default(''),
  url: text('url').notNull(),
  platform: text('platform').notNull().default('youtube'),
  thumb: text('thumb'),
  order: integer('order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Configuración del sitio (clave/valor JSON)
// keys: contact, social, map, seo, analytics, hours, insurance, msi
// ─────────────────────────────────────────────────────────────
export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// EXPEDIENTE CLÍNICO
// ─────────────────────────────────────────────────────────────

// Pacientes (ficha / expediente)
export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email'),
  birthdate: date('birthdate'),
  // Antecedentes médicos / alergias / observaciones generales
  medicalNotes: text('medical_notes'),
  // Doctora principal (referencia rápida; no exclusiva)
  doctorId: integer('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Casos / planes de tratamiento de un paciente
// status: active | completed | paused | cancelled
export const treatmentCases = pgTable('treatment_cases', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: integer('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
  serviceId: integer('service_id').references(() => services.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  diagnosis: text('diagnosis'),
  plan: text('plan'),
  plannedSessions: integer('planned_sessions').notNull().default(1),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Sesiones clínicas (seguimiento: sesión 1, 2, 3…)
// status: planned | done | cancelled | no_show
export const clinicalSessions = pgTable('clinical_sessions', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id')
    .notNull()
    .references(() => treatmentCases.id, { onDelete: 'cascade' }),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: integer('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
  // Cita pública vinculada (opcional)
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  seq: integer('seq').notNull().default(1),
  date: date('date'),
  time: time('time'),
  status: text('status').notNull().default('planned'),
  // Procedimiento realizado + notas clínicas
  procedure: text('procedure'),
  notes: text('notes'),
  nextSuggestedDate: date('next_suggested_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Tokens de opinión (QR de calificación post-consulta)
// ─────────────────────────────────────────────────────────────
export const reviewTokens = pgTable('review_tokens', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  doctorId: integer('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
  patientName: text('patient_name').notNull().default(''),
  patientId: integer('patient_id').references(() => patients.id, { onDelete: 'set null' }),
  sessionId: integer('session_id').references(() => clinicalSessions.id, { onDelete: 'set null' }),
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Adjuntos: radiografías, fotos clínicas, documentos
// kind: xray | photo | doc
export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  caseId: integer('case_id').references(() => treatmentCases.id, { onDelete: 'set null' }),
  sessionId: integer('session_id').references(() => clinicalSessions.id, { onDelete: 'set null' }),
  url: text('url').notNull(),
  kind: text('kind').notNull().default('photo'),
  label: text('label'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
