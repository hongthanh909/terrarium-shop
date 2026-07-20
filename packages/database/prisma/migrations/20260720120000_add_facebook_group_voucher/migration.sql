DO $$ BEGIN
  CREATE TYPE "FacebookVoucherClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REDEEMED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "discount_campaigns" ADD COLUMN IF NOT EXISTS "requiresApproval" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "facebook_voucher_claims" (
  "id" TEXT NOT NULL, "customerId" TEXT NOT NULL, "campaignId" TEXT NOT NULL, "orderId" TEXT,
  "facebookName" TEXT NOT NULL, "facebookProfileUrl" TEXT, "status" "FacebookVoucherClaimStatus" NOT NULL DEFAULT 'PENDING',
  "reviewNote" TEXT, "reviewedAt" TIMESTAMP(3), "redeemedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "facebook_voucher_claims_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "facebook_voucher_claims_customerId_campaignId_key" ON "facebook_voucher_claims"("customerId", "campaignId");
CREATE UNIQUE INDEX IF NOT EXISTS "facebook_voucher_claims_orderId_key" ON "facebook_voucher_claims"("orderId");
CREATE INDEX IF NOT EXISTS "facebook_voucher_claims_status_createdAt_idx" ON "facebook_voucher_claims"("status", "createdAt");
DO $$ BEGIN ALTER TABLE "facebook_voucher_claims" ADD CONSTRAINT "facebook_voucher_claims_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "facebook_voucher_claims" ADD CONSTRAINT "facebook_voucher_claims_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "discount_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "facebook_voucher_claims" ADD CONSTRAINT "facebook_voucher_claims_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO "discount_campaigns" ("id", "code", "type", "value", "minOrderAmount", "startsAt", "expiresAt", "status", "applicableTo", "description", "requiresApproval", "updatedAt")
VALUES ('facebook-group-100k-2026', 'NHOMREU100', 'FIXED', 100000, 1500000, CURRENT_TIMESTAMP - interval '1 day', '2027-12-31T16:59:59Z', 'ACTIVE', 'ALL', 'Uu dai thanh vien nhom Facebook - can admin duyet', true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET "requiresApproval" = true, "minOrderAmount" = 1500000, "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "site_settings" ("id", "key", "value", "description", "updatedAt")
SELECT 'facebook-group-promo-setting', 'facebook_group_promo', jsonb_build_object(
  'enabled', true, 'title', 'Tham gia cộng đồng Tiệm Rêu',
  'description', 'Nhận voucher giảm 100.000đ sau khi admin xác nhận bạn đã tham gia nhóm.',
  'ctaLabel', 'Tham gia nhóm ngay', 'groupUrl', 'https://www.facebook.com/share/g/1ECmLr183E/',
  'campaignId', "id", 'delaySeconds', 2, 'repeatDays', 7
), 'Cau hinh popup moi tham gia nhom Facebook', CURRENT_TIMESTAMP
FROM "discount_campaigns" WHERE "code" = 'NHOMREU100'
ON CONFLICT ("key") DO NOTHING;
