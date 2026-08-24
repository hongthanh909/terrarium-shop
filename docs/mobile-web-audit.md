# Mobile Web Audit

Baseline: `7d11f92` on `codex/white-ui-redesign`

Implementation branch: `codex/mobile-web-redesign`

## Target viewports

- 360 x 800: compact Android and older iPhone widths
- 390 x 844: current iPhone baseline
- 412 x 915: large Android baseline
- 768 x 1024: tablet portrait
- 1024 x 768: tablet landscape
- 1440 x 1000: desktop regression baseline

## Verified routes

The public routes `/`, `/products`, `/explore`, `/blog`, `/policies`, `/contact`,
`/consult`, and `/login` have no horizontal document overflow at 390px or 768px.
Protected routes correctly redirect unauthenticated visitors to `/login`.

## Priority findings

1. `/contact` and `/consult` render a nested `main` landmark inside the root layout.
2. Header, footer, consent, and floating chat compete for limited mobile screen space.
3. Text links and several icon controls expose touch targets below 44 x 44px.
4. Mobile drawer and cart drawer need consistent safe-area padding and close controls.
5. Login is responsive, but forgot/reset pages still contain oversized decorative layers.
6. Checkout and product detail already reserve safe-area space for fixed purchase actions.
7. Authenticated account, order, checkout, and message routes require a signed-in QA pass.
8. Admin tables remain horizontally scrollable; critical admin workflows need mobile list views.

## Delivery gates

- No horizontal document overflow from 360px through 1440px.
- One `main` landmark per route.
- Primary controls and icon buttons expose at least a 44 x 44px touch target.
- Fixed UI respects `env(safe-area-inset-*)` and does not obscure primary actions.
- Mobile inputs remain at least 16px to avoid unwanted iOS zoom.
- Reduced-motion behavior remains available for non-essential animation.
- Production build, TypeScript, ESLint, and route screenshots pass before staging.
