DO $$ BEGIN
  CREATE TYPE "DiscountCodeStatus" AS ENUM ('ACTIVE', 'USED', 'DISABLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "discount_codes" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" "DiscountCodeStatus" NOT NULL DEFAULT 'ACTIVE',
  "usageLimit" INTEGER DEFAULT 1,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "discount_codes_code_key" ON "discount_codes"("code");
CREATE INDEX IF NOT EXISTS "discount_codes_campaignId_status_idx" ON "discount_codes"("campaignId", "status");

DO $$ BEGIN
  ALTER TABLE "discount_codes"
    ADD CONSTRAINT "discount_codes_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "discount_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "order_discounts"
  ADD COLUMN IF NOT EXISTS "discountCodeId" TEXT;

CREATE INDEX IF NOT EXISTS "order_discounts_discountCodeId_idx" ON "order_discounts"("discountCodeId");

DO $$ BEGIN
  ALTER TABLE "order_discounts"
    ADD CONSTRAINT "order_discounts_discountCodeId_fkey"
    FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
