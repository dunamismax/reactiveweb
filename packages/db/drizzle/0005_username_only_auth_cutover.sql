DROP TABLE IF EXISTS "demo_invites";

ALTER TABLE "demo_users"
  DROP CONSTRAINT IF EXISTS "demo_users_email_unique";

ALTER TABLE "demo_users"
  DROP COLUMN IF EXISTS "email";
