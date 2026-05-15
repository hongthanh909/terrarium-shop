# TERRARIUM SHOP - PROJECT STRUCTURE

## Tổng quan kiến trúc

```
terrarium-shop/
├── apps/
│   └── web/                            # Next.js 14+ App Router
│       ├── app/
│       │   ├── (shop)/                 # Storefront - Khách hàng
│       │   │   ├── page.tsx            # 🏠 HOME (Hero, Featured, New)
│       │   │   ├── products/
│       │   │   │   ├── page.tsx        # 🛍️ SHOP (Tất cả SP + Filters)
│       │   │   │   └── [slug]/
│       │   │   │       └── page.tsx    # 📦 Product Detail + Reviews
│       │   │   ├── explore/
│       │   │   │   └── page.tsx        # 🔥 EXPLORE (Top voted + Pinned)
│       │   │   ├── cart/
│       │   │   ├── checkout/
│       │   │   ├── account/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── orders/
│       │   │   │   ├── care-items/
│       │   │   │   ├── loyalty/
│       │   │   │   └── reviews/
│       │   │   └── wishlist/
│       │   ├── (admin)/                # 🎛️ Admin Dashboard
│       │   │   └── admin/
│       │   │       ├── dashboard/
│       │   │       ├── products/
│       │   │       ├── combos/
│       │   │       ├── categories/
│       │   │       ├── orders/
│       │   │       ├── customers/
│       │   │       ├── vouchers/       # 💸 Quản lý voucher
│       │   │       ├── campaigns/
│       │   │       ├── reviews/        # ✅ Duyệt đánh giá
│       │   │       ├── blog/
│       │   │       ├── care-guides/
│       │   │       ├── loyalty/
│       │   │       └── settings/
│       │   ├── api/                    # 🔌 API Routes
│       │   │   ├── products/
│       │   │   ├── combos/
│       │   │   ├── categories/
│       │   │   ├── cart/
│       │   │   ├── checkout/
│       │   │   ├── orders/
│       │   │   ├── vouchers/           # Validate voucher
│       │   │   ├── discounts/          # Get active campaigns
│       │   │   ├── reviews/            # Submit/approve reviews
│       │   │   ├── loyalty/
│       │   │   ├── wishlist/
│       │   │   ├── payment/
│       │   │   │   ├── momo/
│       │   │   │   └── ghn/
│       │   │   ├── care/
│       │   │   └── auth/
│       │   ├── explore/                # Explore page logic
│       │   │   └── page.tsx
│       │   ├── blog/                   # Blog pages
│       │   │   ├── page.tsx
│       │   │   └── [slug]/
│       │   │       └── page.tsx
│       │   ├── sitemap.ts
│       │   └── robots.ts
│       │
│       ├── components/
│       │   ├── ui/                     # shadcn components
│       │   ├── layout/
│       │   ├── products/
│       │   │   ├── product-card.tsx
│       │   │   ├── product-grid.tsx
│       │   │   ├── product-filters.tsx
│       │   │   └── product-gallery.tsx
│       │   ├── cart/
│       │   ├── checkout/
│       │   │   └── voucher-input.tsx
│       │   ├── explore/                # 🔥 Explore components
│       │   │   ├── featured-carousel.tsx
│       │   │   ├── top-voted-grid.tsx
│       │   │   └── pinned-badge.tsx
│       │   ├── reviews/                # ⭐ Review components
│       │   │   ├── review-card.tsx
│       │   │   ├── review-form.tsx
│       │   │   ├── star-rating.tsx
│       │   │   └── review-list.tsx
│       │   ├── vouchers/
│       │   ├── loyalty/
│       │   ├── care/
│       │   ├── blog/
│       │   ├── admin/
│       │   │   ├── data-table.tsx
│       │   │   ├── voucher-form.tsx
│       │   │   ├── product-form.tsx
│       │   │   └── review-approval.tsx
│       │   └── ai-chat/                # 🤖 AI Chatbot (optional, phase 2)
│       │       ├── chat-widget.tsx     # Floating button
│       │       └── chat-window.tsx
│       │
│       ├── lib/
│       │   ├── prisma.ts
│       │   ├── voucher-engine.ts       # Validate vouchers
│       │   ├── pricing-calculator.ts   # Tính giá + discounts
│       │   ├── loyalty-engine.ts       # Points calculation
│       │   ├── review-engine.ts        # ⭐ Review approval logic
│       │   ├── explore-engine.ts       # 🔥 Top voted + pinned logic
│       │   ├── ghn.ts
│       │   ├── momo.ts
│       │   └── utils.ts
│       │
│       ├── hooks/
│       │   ├── use-cart.ts
│       │   ├── use-voucher.ts
│       │   ├── use-loyalty.ts
│       │   ├── use-reviews.ts          # ⭐ Review hooks
│       │   └── use-explore.ts          # 🔥 Explore hooks
│       │
│       ├── stores/
│       ├── types/
│       │   ├── product.ts
│       │   ├── voucher.ts
│       │   ├── review.ts               # ⭐ Review types
│       │   └── explore.ts              # 🔥 Explore types
│       └── styles/
│
├── packages/
│   └── database/
│       ├── schema.prisma               # 25 tables
│       └── migrations/
│
├── docs/
│   ├── business-rules.md
│   ├── voucher-system.md
│   └── review-system.md                # ⭐ Review logic
│
└── package.json
```

## Giải thích cấu trúc

### Monorepo Structure

- **apps/web**: Application chính (Next.js)
- **packages/database**: Shared database layer (Prisma)
- **docs**: Tài liệu dự án

### Route Groups

- **`(shop)`**: Frontend cho khách hàng (không ảnh hưởng URL)
- **`(admin)`**: Admin dashboard với prefix `/admin`
- **`api/`**: API routes cho backend logic

### Component Organization

- **`ui/`**: Reusable components từ shadcn/ui
- **`features/`**: Feature-specific components (products, cart, etc.)
- **`layout/`**: Layout components (header, footer, sidebar)

### Lib & Utilities

- **`lib/`**: Business logic engines và SDK clients
- **`hooks/`**: Custom React hooks
- **`stores/`**: Zustand state management
- **`types/`**: TypeScript type definitions