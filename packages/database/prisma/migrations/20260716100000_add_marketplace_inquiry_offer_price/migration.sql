ALTER TABLE "marketplace_inquiries"
ADD COLUMN IF NOT EXISTS "offerPrice" DECIMAL(10,2);
