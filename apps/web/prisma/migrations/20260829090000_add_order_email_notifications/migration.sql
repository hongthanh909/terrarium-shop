DO $$ BEGIN
  CREATE TYPE "OrderEmailEvent" AS ENUM (
    'ORDER_CREATED',
    'ORDER_STATUS_CHANGED',
    'PAYMENT_STATUS_CHANGED',
    'PAYMENT_CONFIRMED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmailDeliveryStatus" AS ENUM (
    'PENDING',
    'SENDING',
    'SENT',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "order_email_notifications" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "eventType" "OrderEmailEvent" NOT NULL,
  "recipient" TEXT NOT NULL,
  "payload" JSONB,
  "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "providerMessageId" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "order_email_notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "order_email_notifications_eventKey_key"
  ON "order_email_notifications"("eventKey");

CREATE INDEX IF NOT EXISTS "order_email_notifications_status_createdAt_idx"
  ON "order_email_notifications"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "order_email_notifications_orderId_createdAt_idx"
  ON "order_email_notifications"("orderId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "order_email_notifications"
    ADD CONSTRAINT "order_email_notifications_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
