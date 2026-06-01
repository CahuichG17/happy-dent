CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"service_id" integer,
	"doctor_id" integer,
	"date" date NOT NULL,
	"time" time NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_services" (
	"doctor_id" integer NOT NULL,
	"service_id" integer NOT NULL,
	CONSTRAINT "doctor_services_doctor_id_service_id_pk" PRIMARY KEY("doctor_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"spec_es" text DEFAULT '' NOT NULL,
	"spec_en" text DEFAULT '' NOT NULL,
	"bio_es" text DEFAULT '' NOT NULL,
	"bio_en" text DEFAULT '' NOT NULL,
	"initials" text DEFAULT '' NOT NULL,
	"photo_url" text,
	"credentials" text,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doctors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"q_es" text NOT NULL,
	"q_en" text NOT NULL,
	"a_es" text NOT NULL,
	"a_en" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total" integer,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_exceptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctor_id" integer NOT NULL,
	"date" date NOT NULL,
	"closed" boolean DEFAULT true NOT NULL,
	"start_time" time,
	"end_time" time,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctor_id" integer NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_min" integer DEFAULT 30 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title_es" text NOT NULL,
	"title_en" text NOT NULL,
	"desc_es" text DEFAULT '' NOT NULL,
	"desc_en" text DEFAULT '' NOT NULL,
	"icon" text,
	"photo_url" text,
	"features_es" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"features_en" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category" text,
	"price_amount" integer,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"show_price" boolean DEFAULT false NOT NULL,
	"duration_min" integer DEFAULT 30 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role_es" text DEFAULT '' NOT NULL,
	"role_en" text DEFAULT '' NOT NULL,
	"text_es" text NOT NULL,
	"text_en" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"avatar" text,
	"approved" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"platform" text DEFAULT 'youtube' NOT NULL,
	"thumb" text,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_services" ADD CONSTRAINT "doctor_services_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_services" ADD CONSTRAINT "doctor_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_doctor_slot_unique" ON "appointments" USING btree ("doctor_id","date","time");