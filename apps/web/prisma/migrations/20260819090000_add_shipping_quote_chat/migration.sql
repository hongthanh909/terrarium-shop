ALTER TYPE "ChatProductType" ADD VALUE IF NOT EXISTS 'ORDER';

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "shippingQuoteRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "shippingQuoteNote" TEXT;

ALTER TABLE "chat_conversations"
  ADD COLUMN IF NOT EXISTS "orderId" TEXT;

ALTER TABLE "chat_conversations"
  DROP CONSTRAINT IF EXISTS "chat_conversations_product_check";

ALTER TABLE "chat_conversations"
  ADD CONSTRAINT "chat_conversations_product_check" CHECK (
    ("productType" = 'CATALOG' AND "catalogProductId" IS NOT NULL AND "marketplaceProductId" IS NULL AND "orderId" IS NULL)
    OR
    ("productType" = 'MARKETPLACE' AND "marketplaceProductId" IS NOT NULL AND "catalogProductId" IS NULL AND "orderId" IS NULL)
    OR
    ("productType" = 'ORDER' AND "catalogProductId" IS NULL AND "marketplaceProductId" IS NULL AND "orderId" IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS "chat_conversations_orderId_key"
  ON "chat_conversations"("orderId")
  WHERE "orderId" IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE "chat_conversations"
    ADD CONSTRAINT "chat_conversations_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
