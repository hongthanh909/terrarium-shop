# Mobile Web Audit

Baseline: `7d11f92` on `codex/white-ui-redesign`

Implementation branch: `codex/mobile-web-redesign`

Final implementation commit: `5d91b15`

## Target viewports

- 360 x 800: compact Android and older iPhone widths
- 390 x 844: current iPhone baseline
- 412 x 915: large Android baseline
- 768 x 1024: tablet portrait
- 1024 x 768: tablet landscape
- 1440 x 1000: desktop regression baseline

## Verified routes

The public routes `/`, `/products`, `/explore`, `/blog`, `/policies`, `/contact`,
`/consult`, `/login`, and `/forgot-password` have no horizontal document overflow at
390px or 768px. Each verified route has one `main` landmark and visible form controls
meet the 44px height and 16px mobile font gates.

Protected routes correctly redirect unauthenticated visitors to `/login`.

## Completed phases

1. Locked the white UI baseline and created a dedicated mobile branch.
2. Audited public, account, commerce, messaging, and admin surfaces.
3. Added global touch, safe-area, dynamic viewport, and overlay primitives.
4. Reworked header, footer, consent, chat, drawer, and cart behavior.
5. Reworked public contact and AI consultation pages.
6. Improved product variants, vouchers, cart actions, and checkout forms.
7. Improved login, password recovery, profile, orders, and customer messaging.
8. Replaced the admin horizontal mobile menu with a drawer and improved shared tables.
9. Corrected canonical inheritance, private-route indexing, sitemap, and metadata.
10. Completed responsive regression QA and a production build.

## Validation results

- `npm run lint --workspace apps/web`: passed.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: passed.
- `npm run build --workspace apps/web`: passed, including all 91 generated pages.
- Playwright route audit at 390 x 844 and 768 x 1024: passed with zero horizontal overflow.
- Login at 390px: 48px inputs, 16px text, and no floating chat over primary actions.
- Product search at 390px: 48px input, 16px text, and zero horizontal overflow.

## Remaining staging checks

1. Product detail visual QA needs production-like product fixtures because the local database does not contain the production slugs.
2. Checkout, profile, orders, and customer messaging need an authenticated staging account.
3. Admin drawer, order tables, vouchers, analytics, and admin messaging need an authenticated staging admin.
4. Test iOS Safari safe areas, Android Chrome back navigation, image upload, and virtual keyboard behavior on physical devices.
5. Run Lighthouse against the staging build with production-like images and database latency.

## Staging workflow

1. Push `codex/mobile-web-redesign` without merging it into `main`.
2. Configure staging to deploy this branch with a staging database and staging OAuth callbacks.
3. Run the remaining authenticated and physical-device checks above.
4. Record any staging fixes as commits on the same branch.
5. Merge to `main` only after the staging checklist passes and a database backup is confirmed.

## Resolved findings

1. Removed nested `main` landmarks from contact, consultation, and password recovery.
2. Coordinated header, footer, consent, voucher popup, chat, and drawer overlays.
3. Raised primary touch targets and mobile form controls to the delivery gates.
4. Applied safe-area padding to fixed purchase, chat, consent, and admin message controls.
5. Replaced the old green gradient password recovery UI with the white design system.
6. Added a discoverable admin mobile drawer and responsive shared table controls.

## Delivery gates

- No horizontal document overflow from 360px through 1440px.
- One `main` landmark per route.
- Primary controls and icon buttons expose at least a 44 x 44px touch target.
- Fixed UI respects `env(safe-area-inset-*)` and does not obscure primary actions.
- Mobile inputs remain at least 16px to avoid unwanted iOS zoom.
- Reduced-motion behavior remains available for non-essential animation.
- Production build, TypeScript, ESLint, and route screenshots pass before staging.
