DO $$ BEGIN
  CREATE TYPE "ChatProductType" AS ENUM ('CATALOG', 'MARKETPLACE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChatConversationStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChatSenderType" AS ENUM ('CUSTOMER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "chat_conversations" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "productType" "ChatProductType" NOT NULL,
  "catalogProductId" TEXT,
  "marketplaceProductId" TEXT,
  "status" "ChatConversationStatus" NOT NULL DEFAULT 'OPEN',
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "customerUnreadCount" INTEGER NOT NULL DEFAULT 0,
  "adminUnreadCount" INTEGER NOT NULL DEFAULT 0,
  "customerLastReadAt" TIMESTAMP(3),
  "adminLastReadAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_conversations_product_check" CHECK (
    ("productType" = 'CATALOG' AND "catalogProductId" IS NOT NULL AND "marketplaceProductId" IS NULL)
    OR
    ("productType" = 'MARKETPLACE' AND "marketplaceProductId" IS NOT NULL AND "catalogProductId" IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "senderType" "ChatSenderType" NOT NULL,
  "content" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_messages_content_check" CHECK (
    NULLIF(BTRIM(COALESCE("content", '')), '') IS NOT NULL OR "imageUrl" IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_conversations_customer_catalog_key"
  ON "chat_conversations"("customerId", "catalogProductId")
  WHERE "catalogProductId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "chat_conversations_customer_marketplace_key"
  ON "chat_conversations"("customerId", "marketplaceProductId")
  WHERE "marketplaceProductId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "chat_conversations_status_lastMessageAt_idx"
  ON "chat_conversations"("status", "lastMessageAt");

CREATE INDEX IF NOT EXISTS "chat_conversations_adminUnreadCount_lastMessageAt_idx"
  ON "chat_conversations"("adminUnreadCount", "lastMessageAt");

CREATE INDEX IF NOT EXISTS "chat_conversations_customerId_lastMessageAt_idx"
  ON "chat_conversations"("customerId", "lastMessageAt");

CREATE INDEX IF NOT EXISTS "chat_messages_conversationId_createdAt_idx"
  ON "chat_messages"("conversationId", "createdAt");

CREATE INDEX IF NOT EXISTS "chat_messages_senderType_createdAt_idx"
  ON "chat_messages"("senderType", "createdAt");

DO $$ BEGIN
  ALTER TABLE "chat_conversations"
    ADD CONSTRAINT "chat_conversations_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chat_conversations"
    ADD CONSTRAINT "chat_conversations_catalogProductId_fkey"
    FOREIGN KEY ("catalogProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chat_conversations"
    ADD CONSTRAINT "chat_conversations_marketplaceProductId_fkey"
    FOREIGN KEY ("marketplaceProductId") REFERENCES "marketplace_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chat_messages"
    ADD CONSTRAINT "chat_messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chat_messages"
    ADD CONSTRAINT "chat_messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
