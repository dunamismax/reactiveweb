ALTER TABLE "demo_invites"
  ADD COLUMN IF NOT EXISTS "token_hash" text;

ALTER TABLE "demo_invites"
  ALTER COLUMN "token" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "demo_invites_token_hash_unique"
  ON "demo_invites" ("token_hash");

-- Legacy plaintext tokens are lazily backfilled to token_hash on read in app code.
