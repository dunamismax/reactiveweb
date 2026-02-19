CREATE TABLE IF NOT EXISTS "demo_auth_attempts" (
  "username" text PRIMARY KEY NOT NULL,
  "failed_attempts" integer NOT NULL DEFAULT 0,
  "last_failed_at" timestamp with time zone,
  "locked_until" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
