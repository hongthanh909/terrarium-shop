# FINAL CHECKLIST - TERRARIUM SHOP

## Phase 0: Setup (Ngày 1-2)

### Database & Infrastructure

- [ ] Tạo Supabase project tại supabase.com
- [ ] Lấy `DATABASE_URL` từ Settings > Database
- [ ] Lấy `SUPABASE_URL` và `SUPABASE_ANON_KEY`
- [ ] Tạo .env file với các biến môi trường

### Project Initialization

- [ ] Clone/create repo GitHub
- [ ] Install dependencies: `npm install`
- [ ] Setup Prisma: `npx prisma init`
- [ ] Copy schema.prisma vào `packages/database/`
- [ ] Run migration: `npx prisma migrate dev --name init`
- [ ] Generate Prisma Client: `npx prisma generate`

### Next.js Setup

- [ ] Initialize Next.js: `npx create-next-app@latest apps/web`
- [ ] Install shadcn/ui: `npx shadcn-ui@latest init`
- [ ] Install core components: button, card, input, dialog, etc.
- [ ] Configure Tailwind with custom colors (territory theme)
- [ ] Setup fonts: Plus Jakarta Sans + Playfair Display

---

## Phase 1: Core Features (Tuần 1)

### Product Management (Admin)

- [ ] Create Product API (`/api/products`)
- [ ] Product listing page (Admin)
- [ ] Product create/edit form (Admin)
- [ ] Product variant management
- [ ] Product image upload (Supabase Storage)

### Public Product Pages

- [ ] Homepage with featured products
- [ ] Product listing page (Shop)
- [ ] Product detail page (SEO optimized)
- [ ] Product filters (category, size, price)
- [ ] Related products section

### Cart & Checkout

- [ ] Cart state management (Zustand)
- [ ] Cart drawer/page
- [ ] Checkout form (shipping, payment)
- [ ] Voucher input & validation
- [ ] Order creation API

---

## Phase 2: Payment & Shipping (Tuần 2)

### Payment Integration

- [ ] Setup Momo developer account
- [ ] Implement Momo payment API
- [ ] Handle Momo webhook
- [ ] Implement COD (Cash on Delivery)
- [ ] Payment status tracking

### Shipping Integration

- [ ] Setup GHN merchant account
- [ ] Implement GHN shipping API
- [ ] Calculate shipping fee
- [ ] Create shipping order
- [ ] Handle GHN webhook (tracking updates)
- [ ] Shipping tracking page

### Order Management

- [ ] Order list (Admin)
- [ ] Order detail (Admin)
- [ ] Update order status
- [ ] Order history (Customer)
- [ ] Order detail (Customer)

---

## Phase 3: Voucher System (Tuần 3)

### Voucher CRUD (Admin)

- [ ] Create discount campaign
- [ ] List all campaigns
- [ ] Edit campaign
- [ ] Activate/deactivate campaign
- [ ] Set applicable products/categories

### Voucher Validation

- [ ] Implement `voucher-engine.ts`
- [ ] Validate code existence
- [ ] Check expiry dates
- [ ] Check usage limits
- [ ] Calculate discount amount
- [ ] Apply discount to order

### Voucher UI

- [ ] Voucher input component
- [ ] Voucher list (customer view)
- [ ] Applied voucher display
- [ ] Error messages for invalid vouchers

---

## Phase 4: Reviews & Explore (Tuần 4)

### Review System

- [ ] Submit review (customer)
- [ ] Review approval (admin)
- [ ] Review list on product detail
- [ ] Star rating display
- [ ] Verified badge for verified purchases

### Explore Page

- [ ] Featured products carousel
- [ ] New arrivals section
- [ ] Top voted products (weekly/monthly)
- [ ] Vote product (customer)
- [ ] Admin pin/unpin products

### Loyalty System

- [ ] Create customer care preferences
- [ ] Track customer purchases
- [ ] Calculate loyalty points
- [ ] Display loyalty tier badge
- [ ] Points history

---

## Phase 5: Care & Content (Tuần 5)

### Care Guides

- [ ] Create care guide (admin)
- [ ] Link care guide to product
- [ ] Display care guide on product detail
- [ ] Customer care items (post-purchase)

### Care Reminders

- [ ] Implement `care-schedule-engine.ts`
- [ ] Setup cron job (Vercel Cron)
- [ ] Send email reminders (Resend)
- [ ] Log care actions (water, prune)

### Blog

- [ ] Create blog post (admin)
- [ ] Blog listing page
- [ ] Blog detail page (SEO optimized)
- [ ] Blog categories

---

## Phase 6: Polish & Launch (Tuần 6)

### SEO Optimization

- [ ] Meta tags for all pages
- [ ] Open Graph tags
- [ ] Schema.org markup (Product, Organization)
- [ ] Dynamic sitemap.xml
- [ ] robots.txt
- [ ] Canonical URLs

### Performance

- [ ] Image optimization (Next.js Image)
- [ ] Lazy loading
- [ ] Core Web Vitals optimization
- [ ] Cache strategy (TanStack Query)

### Testing

- [ ] Test checkout flow end-to-end
- [ ] Test voucher validation
- [ ] Test payment flow (sandbox)
- [ ] Test GHN webhook
- [ ] Test review submission & approval

### Security

- [ ] Setup auth middleware
- [ ] Protect admin routes
- [ ] Validate all API inputs (Zod)
- [ ] Rate limiting on API routes
- [ ] CORS configuration

### Deployment

- [ ] Deploy to Vercel
- [ ] Setup custom domain
- [ ] Configure environment variables
- [ ] Setup monitoring (Vercel Analytics)
- [ ] Test in production

---

## Post-Launch (Phase 2 - Optional)

### AI Chatbot

- [ ] Setup Ollama (local or cloud)
- [ ] Create system prompt for terrarium bot
- [ ] Implement chat widget UI
- [ ] Integrate product suggestions
- [ ] Test with real queries

### Advanced Features

- [ ] Advanced search (Algolia)
- [ ] Redis caching (Upstash)
- [ ] Push notifications
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npx prisma studio        # Open Prisma Studio
npx prisma migrate dev   # Create & run migration
npx prisma generate      # Generate Prisma Client

# Database
npx prisma migrate dev --name <name>   # Create migration
npx prisma migrate deploy              # Deploy migration (prod)
npx prisma db seed                     # Seed database

# Build & Deploy
npm run build            # Build for production
npm run start            # Start production server
vercel deploy            # Deploy to Vercel

# Testing
npm run test             # Run tests
npm run lint             # Run linter
```

---

## Environment Variables Template

```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_KEY]"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[GENERATE_SECRET]"

# GHN
GHN_SHOP_ID="[SHOP_ID]"
GHN_TOKEN="[TOKEN]"
GHN_BRANCH_ID="[BRANCH_ID]"

# Momo
MOMO_partnerCode="[CODE]"
MOMO_accessKey="[KEY]"
MOMO_secretKey="[SECRET]"
MOMO_apiUrl="[URL]"

# Resend
RESEND_API_KEY="[KEY]"

# Ollama (Optional, Phase 2)
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3"

# Site
NEXT_PUBLIC_SITE_URL="https://[YOUR_DOMAIN].com"
```

---

## Resources & Documentation Links

### Core Technologies

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/docs)
- [Tailwind CSS](https://tailwindcss.org/docs)

### Third-Party Services

- [GHN API Docs](https://developers.giaohannhanh.vn/)
- [Momo Developer Portal](https://developers.momo.vn/)
- [Resend Docs](https://resend.com/docs)
- [Vercel Docs](https://vercel.com/docs)

### Tools

- [Prisma Studio](http://localhost:5555)
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)