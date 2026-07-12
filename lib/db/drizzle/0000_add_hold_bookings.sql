CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"language" text DEFAULT 'ar' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" text,
	"father_name" text,
	"grandfather_name" text,
	"family_name" text,
	"english_name" text,
	"gender" text,
	"dob" text,
	"nationality" text,
	"place_of_birth" text,
	"marital_status" text,
	"occupation" text,
	"whatsapp" text,
	"address" text,
	"passport_number" text,
	"passport_issuing_country" text,
	"passport_issuing_place" text,
	"passport_issue_date" text,
	"passport_expiry" text,
	"passport_image_url" text,
	"has_gulf_residence" boolean DEFAULT false NOT NULL,
	"gulf_residence_country" text,
	"gulf_residence_number" text,
	"gulf_residence_expiry" text,
	"gulf_residence_front_url" text,
	"gulf_residence_back_url" text,
	"residence_type" text DEFAULT 'none' NOT NULL,
	"has_active_foreign_visa" boolean DEFAULT false NOT NULL,
	"active_visas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"has_travel_history" boolean DEFAULT false NOT NULL,
	"travel_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"profile_completed_at" timestamp with time zone,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "visas" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_name" text NOT NULL,
	"country_code" text,
	"country_flag_url" text NOT NULL,
	"country_image_url" text NOT NULL,
	"visa_type" text NOT NULL,
	"processing_time" text NOT NULL,
	"stay_duration" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"description" text NOT NULL,
	"required_documents" text[] NOT NULL,
	"entries_allowed" text NOT NULL,
	"validity" text NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"requires_gulf_residence" boolean DEFAULT false NOT NULL,
	"requires_personal_photo" boolean DEFAULT true NOT NULL,
	"requires_passport_image" boolean DEFAULT true NOT NULL,
	"requires_bank_statement" boolean DEFAULT false NOT NULL,
	"requires_flight_booking" boolean DEFAULT false NOT NULL,
	"requires_hotel_booking" boolean DEFAULT false NOT NULL,
	"requires_travel_insurance" boolean DEFAULT false NOT NULL,
	"requires_additional_docs" boolean DEFAULT false NOT NULL,
	"requires_invitation_letter" boolean DEFAULT false NOT NULL,
	"allowed_nationalities" text[] DEFAULT '{}' NOT NULL,
	"blocked_nationalities" text[] DEFAULT '{}' NOT NULL,
	"requires_gulf_residence_country" text,
	"requires_valid_visa_countries" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visa_application_consents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"visa_id" integer NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visa_eligibility_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"visa_id" integer NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"nationalities" text[] DEFAULT '{}' NOT NULL,
	"allow_direct" boolean DEFAULT false NOT NULL,
	"requires_gulf_residence" boolean DEFAULT false NOT NULL,
	"requires_valid_visa_countries" text[] DEFAULT '{}' NOT NULL,
	"requires_invitation_letter" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"company_name" text DEFAULT '' NOT NULL,
	"logo_url" text,
	"about" text,
	"address" text,
	"website_url" text,
	"google_maps_url" text,
	"phone_primary" text,
	"phone_secondary" text,
	"whatsapp" text,
	"email_support" text,
	"email_official" text,
	"instagram" text,
	"tiktok" text,
	"facebook" text,
	"twitter" text,
	"snapchat" text,
	"youtube" text,
	"linkedin" text,
	"telegram" text,
	"work_days" text,
	"work_hours" text,
	"weekly_off" text,
	"extra_socials" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"google_maps_url" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"work_hours" text,
	"work_days" text,
	"image_url" text,
	"status" text DEFAULT 'open' NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visa_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"visa_id" integer NOT NULL,
	"reference_number" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"nationality" text NOT NULL,
	"passport_number" text NOT NULL,
	"passport_expiry" date NOT NULL,
	"dob" date NOT NULL,
	"gender" text NOT NULL,
	"occupation" text NOT NULL,
	"city" text NOT NULL,
	"passport_image_url" text,
	"personal_photo_url" text,
	"status" text DEFAULT 'received' NOT NULL,
	"passport_type" text,
	"issuing_country" text,
	"passport_issue_date" date,
	"place_of_birth" text,
	"mrz" text,
	"ocr_confidence" integer,
	"ocr_verified" boolean DEFAULT false NOT NULL,
	"status_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requested_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"additional_document_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visa_applications_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"city" text NOT NULL,
	"days" integer NOT NULL,
	"nights" integer NOT NULL,
	"price_from" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"rating" numeric(2, 1) DEFAULT '0' NOT NULL,
	"images" text[] NOT NULL,
	"video_url" text,
	"description" text NOT NULL,
	"hotels_included" text[] NOT NULL,
	"hotel_stars" integer NOT NULL,
	"room_type" text NOT NULL,
	"meals" text NOT NULL,
	"transportation" text NOT NULL,
	"itinerary" jsonb NOT NULL,
	"included_services" text[] NOT NULL,
	"excluded_services" text[] NOT NULL,
	"cancellation_policy" text NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"reference_number" text NOT NULL,
	"travelers_count" integer NOT NULL,
	"traveler_names" text[] NOT NULL,
	"passport_numbers" text[] NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"travel_date" date NOT NULL,
	"notes" text,
	"status" text DEFAULT 'received' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "package_bookings_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "flight_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reference_number" text NOT NULL,
	"offer" jsonb NOT NULL,
	"passengers" jsonb NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'local' NOT NULL,
	"provider_mode" text,
	"booking_reference" text,
	"duffel_order_id" text,
	"eticket_numbers" jsonb,
	"segments" jsonb,
	"baggage" text,
	"hold_expires_at" timestamp with time zone,
	"hold_fee_amount" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flight_bookings_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"title" text,
	"link_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"avatar_url" text,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_number" text NOT NULL,
	"booking_type" text NOT NULL,
	"flight_booking_id" integer,
	"package_booking_id" integer,
	"visa_application_id" integer,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'IQD' NOT NULL,
	"method" text DEFAULT 'cash' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_id" text,
	"paid_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"payment_id" integer,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'IQD' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"issued_at" timestamp with time zone,
	"due_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "hold_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"hold_enabled" boolean DEFAULT true NOT NULL,
	"hold_fee_amount" double precision DEFAULT 25 NOT NULL,
	"hold_duration_hours" integer DEFAULT 24 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visa_eligibility_rules" ADD CONSTRAINT "visa_eligibility_rules_visa_id_visas_id_fk" FOREIGN KEY ("visa_id") REFERENCES "public"."visas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visa_applications" ADD CONSTRAINT "visa_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visa_applications" ADD CONSTRAINT "visa_applications_visa_id_visas_id_fk" FOREIGN KEY ("visa_id") REFERENCES "public"."visas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_bookings" ADD CONSTRAINT "package_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_bookings" ADD CONSTRAINT "package_bookings_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_bookings" ADD CONSTRAINT "flight_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_flight_booking_id_flight_bookings_id_fk" FOREIGN KEY ("flight_booking_id") REFERENCES "public"."flight_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_package_booking_id_package_bookings_id_fk" FOREIGN KEY ("package_booking_id") REFERENCES "public"."package_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_visa_application_id_visa_applications_id_fk" FOREIGN KEY ("visa_application_id") REFERENCES "public"."visa_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;