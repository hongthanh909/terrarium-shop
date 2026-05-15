# 🌱 Terrarium Shop - E-commerce Platform

Next.js Full-stack E-commerce platform for terrarium plants, built with Supabase, Prisma, and shadcn/ui.

## 🏗️ Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **ORM:** Prisma
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **Deployment:** Vercel

## 📦 Project Structure

```
terrarium-shop/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages & API routes
│       ├── components/         # React components
│       ├── lib/                # Utilities & SDK clients
│       ├── hooks/              # Custom React hooks
│       ├── stores/             # Zustand state stores
│       └── types/              # TypeScript type definitions
├── packages/
│   └── database/               # Prisma schema & migrations
└── docs/                       # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd terrarium-shop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Supabase credentials and other API keys.

4. **Setup database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation

- [Final Checklist](docs/FINAL_CHECKLIST.md)
- [Business Rules](docs/BUSINESS_RULES.md)
- [Data Model](docs/DATA_MODEL.md)
- [Tech Stack Details](docs/TECH_STACK.md)

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |

## 📅 Development Phases

- **Phase 0:** Setup & Configuration
- **Phase 1:** Core Features (Products, Cart, Checkout)
- **Phase 2:** Payment & Shipping (Momo, GHN)
- **Phase 3:** Voucher System
- **Phase 4:** Reviews & Explore
- **Phase 5:** Care Content & Reminders
- **Phase 6:** Polish, SEO & Launch

## 📄 License

MIT