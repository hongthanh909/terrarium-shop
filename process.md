# Process Snapshot

> Cap nhat: 2026-06-21
> Muc dich: tom tat tien do hien tai cua du an sau khi doc source code, schema, route, tai lieu va chay kiem tra co ban.

## Tong quan hien tai

Du an `terrarium-shop` la monorepo Next.js 14 App Router, Prisma/PostgreSQL, NextAuth, Tailwind/shadcn, Zustand va TanStack Query. App chinh nam o `apps/web`; database schema co mat o ca `packages/database/prisma/schema.prisma` va `apps/web/prisma/schema.prisma`.

Trang thai tong the: du an da vuot muc scaffold va co mot MVP kha day du cho shop terrarium. Da co storefront, auth khach hang, gio hang, checkout, don hang, profile, admin panel an duong dan `/tiem-nho-nth24`, API routes, blog/content, AI consultant, va pipeline deploy VPS/PM2.

Tuy vay, chua nen coi la production-ready cho toi khi xu ly xong cac diem rui ro ve review, payment, voucher accounting, build production va deploy/env.

## Da hoan thanh hoac da co nen tang

- Public storefront: homepage, products list/detail, explore, blog, policies, contact, consult, checkout, orders, profile, favorites, points.
- Admin panel: dashboard, products, categories, orders, reviews, vouchers/discounts, blog, policies, homepage content, explore pinning, settings, AI knowledge.
- API routes: auth, products, categories, orders, reviews, voucher validation, discount campaigns, blog/comments/likes, profile, admin APIs, upload, search, consult, AI recommend, payment webhook.
- Database schema: products/categories, variants, customers, orders, voucher/discount, reviews/votes, loyalty/care, blog, policies/settings, homepage/contact, audit logs, AI knowledge.
- Security/auth: NextAuth credentials, customer/admin providers, admin secret path, middleware protection, basic security headers, admin audit logging.
- AI consultant: `ChatWidget`, `/api/consult`, knowledge base fallback, product query, Ollama-oriented docs and admin AI knowledge CRUD.
- Deploy/VPS: `.github/workflows/deploy.yml`, `ecosystem.config.js`, `DEPLOY_GUIDE.md`, `migrate.md`, PM2 workflow, VPS-oriented environment notes.

## Kiem tra da chay

- Da doc cau truc repo, route list, Prisma schema, cac API chinh, checkout/payment, review, voucher, admin explore, deploy workflow va tai lieu lien quan.
- `npx.cmd tsc --noEmit --incremental false -p apps\web\tsconfig.json` pass, khong co TypeScript error.
- `npm.cmd run build` chua xac nhan duoc vi `prisma generate` bi `EPERM` khi unlink `node_modules\.prisma\client\index.d.ts` trong sandbox. Build production can chay lai tren moi truong co quyen day du hoac tren VPS.
- Git status truoc khi tao file nay chi thay cac file `.turbo/cache/*` dang untracked; khong thay source file bi thay doi boi cac lenh kiem tra.

## Can hoan thien som

### P0 - Can sua truoc khi deploy that

1. Review API/schema dang lech nhau.
   - Schema `Review` khong co field `status`.
   - `apps/web/app/api/reviews/route.ts`, `apps/web/app/api/reviews/[id]/route.ts` va admin reviews page lai doc/ghi `review.status`.
   - He qua: filter `PENDING/REJECTED` va thao tac approve/reject co nguy co loi runtime.
   - Huong sua: hoac them `status ReviewStatus @default(PENDING)` vao schema va migrate/db push, hoac bo field `status` khoi code va suy ra trang thai tu `approved`.

2. Chuan hoa payment provider.
   - Checkout hien tai dua khach sang QR VietQR/SePay va webhook `/api/payment/webhook` xu ly payload SePay.
   - Route `/api/payment/create-payment-link` tao PayOS link nhung khong thay UI goi den; checklist cu van nhac PayOS.
   - Can chon mot luong chinh: SePay/VietQR hoac PayOS. Neu dung SePay, can cap nhat docs, bo/park route PayOS, cau hinh `SEPAY_WEBHOOK_SECRET` bat buoc production va test webhook domain that.

3. Build production chua duoc xac nhan.
   - Can chay lai `npm run build` tren may/VPS co quyen ghi `node_modules\.prisma`.
   - Can xac nhan env production: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, Supabase/MinIO, email, admin, payment webhook.

4. Database source of truth va deploy DB can ro rang hon.
   - Co hai schema Prisma giong nhau trong `packages/database` va `apps/web`.
   - Deploy workflow dang chay `prisma db push --accept-data-loss` roi `prisma migrate deploy || true`.
   - Can quy dinh schema nao la chinh va han che `--accept-data-loss` tren production neu khong that su chu y.

5. Voucher accounting chua khep kin.
   - Order creation tang `DiscountCampaign.usageCount`.
   - Nhung khong thay tao `OrderDiscount`, trong khi cancel order lai dua vao `order.discounts` de decrement usage.
   - Can tao `OrderDiscount` trong transaction dat hang va dam bao cancel/rollback usageCount nhat quan.

6. Order creation can validate server-side.
   - API tao don dang tin vao client cho `productName`, `productImage`, `price`, `total`.
   - Chua thay decrement inventory trong transaction.
   - Can lookup product/variant tren server, tinh lai gia, validate ton kho, va tru ton khi dat hang thanh cong.

7. Loyalty va care sau mua hang chua hoan chinh.
   - Admin update order sang `DELIVERED` co tang `customer.loyaltyPoints`, nhung chua tao `LoyaltyPoint` history va chua update tier.
   - `CustomerCareItem` co schema nhung chua thay trigger tao sau khi mua hang thanh cong.
   - Trang points co the hien current points nhung history se trong neu khong ghi record.

### P1 - Can lam de on dinh va de van hanh

- Shipping/GHN: UI dang dung phi co dinh 30k/50k; schema co GHN/tracking nhung chua thay tich hop GHN API that. Neu chap nhan phi co dinh cho MVP, can ghi ro trong docs.
- SEO: can hoan thien default OG image, JSON-LD Product/Organization/BreadcrumbList, canonical URLs.
- Admin vendors route: `apps/web/app/tiem-nho-nth24/vendors/page.tsx` hien la thu muc rong, khong phai file page. Can tao page that hoac xoa route placeholder.
- Docs dang lech nhau: `README.md`, `CHECKLIST.md`, `testing.md` con nhac Vercel/PayOS/Momo/GHN theo ke hoach cu, trong khi `migrate.md` va workflow hien tai nghieng ve VPS/PM2/SePay.
- Debug logs: con nhieu `console.log` trong payment, auth, consult. Nen giam log nhay cam truoc production.
- Middleware admin: neu doi `ADMIN_SECRET_PATH` khac `/tiem-nho-nth24`, matcher trong `middleware.ts` can duoc cap nhat cung luc.
- Rate limit hien tai in-memory; chap nhan cho MVP, nhung neu traffic tang nen chuyen Redis/Upstash hoac rate-limit ben reverse proxy.

## Thu tu de xuat tiep theo

1. Sua mismatch `Review.status` de admin reviews khong loi runtime.
2. Chon va don sach luong payment: SePay/VietQR hoac PayOS, sau do test webhook tren domain that.
3. Sua voucher accounting: tao `OrderDiscount`, rollback usage khi huy don.
4. Lam server-side order validation: gia, ton kho, variant, total, tru inventory.
5. Hoan thien loyalty history va customer care items sau khi don giao thanh cong.
6. Chay lai production build trong moi truong co quyen day du, fix neu co loi.
7. Dong bo docs/checklist theo thuc te hien tai: VPS, SePay/VietQR, AI KB/Ollama, nhung muc da co va chua co.
8. Test E2E cac luong chinh: login/register, cart/checkout COD, bank transfer webhook, cancel expired order, admin CRUD, review approval, voucher, profile/points, deploy.

## Ket luan ngan

MVP da kha day du ve mat tinh nang va UI. Phan con lai khong phai la "xay tu dau" nua ma la giai doan lam chac: fix mismatch schema/code, chuan hoa payment, dong bo accounting du lieu, xac nhan build/deploy va cap nhat tai lieu theo trang thai that.
