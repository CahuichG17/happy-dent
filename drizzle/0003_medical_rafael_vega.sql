CREATE TABLE "review_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"doctor_id" integer,
	"patient_name" text DEFAULT '' NOT NULL,
	"patient_id" integer,
	"appointment_id" integer,
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "review_tokens" ADD CONSTRAINT "review_tokens_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_tokens" ADD CONSTRAINT "review_tokens_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_tokens" ADD CONSTRAINT "review_tokens_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;