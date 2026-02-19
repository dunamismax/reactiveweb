ALTER TABLE "demo_users"
  ADD COLUMN IF NOT EXISTS "username" text;

ALTER TABLE "demo_users"
  ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL;

UPDATE "demo_users"
SET "username" = CONCAT('user_', REPLACE("id"::text, '-', ''))
WHERE "username" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "demo_users_username_unique"
  ON "demo_users" ("username");

ALTER TABLE "demo_users"
  ALTER COLUMN "username" SET NOT NULL;
