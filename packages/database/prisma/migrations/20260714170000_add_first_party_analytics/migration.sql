CREATE TABLE "analytics_visitors" (
  "id" TEXT NOT NULL,
  "anonymousId" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "analytics_visitors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_sessions" (
  "id" TEXT NOT NULL,
  "sessionKey" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "customerId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "entryPath" TEXT NOT NULL,
  "exitPath" TEXT,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "deviceType" TEXT,
  "browser" TEXT,
  "operatingSystem" TEXT,
  "pageViews" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_events" (
  "id" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "analyticsSessionId" TEXT NOT NULL,
  "customerId" TEXT,
  "eventType" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "productId" TEXT,
  "searchTerm" TEXT,
  "durationMs" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_daily_stats" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "visitors" INTEGER NOT NULL DEFAULT 0,
  "sessions" INTEGER NOT NULL DEFAULT 0,
  "pageViews" INTEGER NOT NULL DEFAULT 0,
  "registeredSessions" INTEGER NOT NULL DEFAULT 0,
  "anonymousSessions" INTEGER NOT NULL DEFAULT 0,
  "productViews" INTEGER NOT NULL DEFAULT 0,
  "addToCarts" INTEGER NOT NULL DEFAULT 0,
  "checkouts" INTEGER NOT NULL DEFAULT 0,
  "purchases" INTEGER NOT NULL DEFAULT 0,
  "chatOpens" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "analytics_daily_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analytics_visitors_anonymousId_key" ON "analytics_visitors"("anonymousId");
CREATE INDEX "analytics_visitors_lastSeenAt_idx" ON "analytics_visitors"("lastSeenAt");
CREATE UNIQUE INDEX "analytics_sessions_sessionKey_key" ON "analytics_sessions"("sessionKey");
CREATE INDEX "analytics_sessions_visitorId_lastSeenAt_idx" ON "analytics_sessions"("visitorId", "lastSeenAt");
CREATE INDEX "analytics_sessions_customerId_lastSeenAt_idx" ON "analytics_sessions"("customerId", "lastSeenAt");
CREATE INDEX "analytics_sessions_lastSeenAt_idx" ON "analytics_sessions"("lastSeenAt");
CREATE UNIQUE INDEX "analytics_events_eventKey_key" ON "analytics_events"("eventKey");
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");
CREATE INDEX "analytics_events_analyticsSessionId_createdAt_idx" ON "analytics_events"("analyticsSessionId", "createdAt");
CREATE INDEX "analytics_events_customerId_createdAt_idx" ON "analytics_events"("customerId", "createdAt");
CREATE INDEX "analytics_events_eventType_createdAt_idx" ON "analytics_events"("eventType", "createdAt");
CREATE INDEX "analytics_events_path_createdAt_idx" ON "analytics_events"("path", "createdAt");
CREATE INDEX "analytics_events_productId_createdAt_idx" ON "analytics_events"("productId", "createdAt");
CREATE UNIQUE INDEX "analytics_daily_stats_date_key" ON "analytics_daily_stats"("date");
CREATE INDEX "analytics_daily_stats_date_idx" ON "analytics_daily_stats"("date");

ALTER TABLE "analytics_sessions" ADD CONSTRAINT "analytics_sessions_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "analytics_visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analytics_sessions" ADD CONSTRAINT "analytics_sessions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "analytics_visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_analyticsSessionId_fkey" FOREIGN KEY ("analyticsSessionId") REFERENCES "analytics_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "policies"
SET "content" = "content" || E'\n\nThống kê truy cập\nTiệm Rêu sử dụng mã nhận diện ngẫu nhiên first-party để thống kê lượt truy cập, trang và sản phẩm được xem, thao tác giỏ hàng và thời lượng phiên. Hệ thống không ghi nội dung chat, biểu mẫu, địa chỉ, số điện thoại, dữ liệu thanh toán hoặc thao tác chuột. Khách có thể chọn Chỉ cần thiết để không tham gia thống kê. Dữ liệu sự kiện chi tiết được giữ tối đa 90 ngày; số liệu tổng hợp được giữ tối đa 12 tháng.',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "type" = 'privacy'
  AND "content" NOT LIKE '%Thống kê truy cập%';

INSERT INTO "policies" ("id", "slug", "title", "content", "type", "order", "isActive", "createdAt", "updatedAt")
SELECT 'analytics-privacy-disclosure', 'thong-ke-truy-cap', 'Thống kê truy cập',
       'Tiệm Rêu sử dụng mã nhận diện ngẫu nhiên first-party để thống kê lượt truy cập, trang và sản phẩm được xem, thao tác giỏ hàng và thời lượng phiên. Hệ thống không ghi nội dung chat, biểu mẫu, địa chỉ, số điện thoại, dữ liệu thanh toán hoặc thao tác chuột. Khách có thể chọn Chỉ cần thiết để không tham gia thống kê. Dữ liệu sự kiện chi tiết được giữ tối đa 90 ngày; số liệu tổng hợp được giữ tối đa 12 tháng.',
       'privacy', 99, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "policies" WHERE "type" = 'privacy');
