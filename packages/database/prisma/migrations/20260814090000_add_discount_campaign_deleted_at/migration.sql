ALTER TABLE "discount_campaigns"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "discount_campaigns_deletedAt_idx"
  ON "discount_campaigns"("deletedAt");
