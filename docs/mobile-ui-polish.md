# Mobile UI Polish

Baseline: `ceca92e` from `origin/main`.
Implementation branch: `codex/mobile-ui-polish`.
Scope: customer mobile web and touch-friendly admin. Production deployment follows user review.

## Phases

- [x] 1. Repair narrow layouts, nested interactions, navigation labels and touch targets.
- [x] 2. Align active UI with the monochrome design tokens and shared controls.
- [x] 3. Polish home, catalog, explore and product detail across phone widths.
- [ ] 4. Verify account, cart, checkout, orders and messaging, including long content and keyboard use.
- [x] 5. Coordinate voucher prompts, chat, toast, overlays and safe areas.
- [x] 6. Reduce unnecessary client work and reserve image/layout space.
- [x] 7. Make admin lists, forms, messages and image actions usable on touch screens.
- [x] 8. Run responsive/interaction checks, lint, typecheck and production build.

## Acceptance Checks

- [x] No unintended document or component overflow on the audited public routes at 320, 375, 390, 430 and 768 CSS pixels.
- [x] Desktop baseline at 1440 pixels and landscape at 844 x 390.
- [x] Important visible touch controls on the product detail route have at least 44 x 44 CSS pixels of target area.
- [ ] Product selection, wishlist, voucher copying and cart actions operate independently.
- [ ] Modal focus, escape, keyboard scrolling and fixed actions remain usable.
- Authentication and API behavior remain unchanged by the presentation work.
- Record fixture-driven checks separately from live authenticated checks.
- Physical iOS/Android keyboard and safe-area checks are recorded separately from emulation.

## Verification

Completed implementation and public-route verification. Authenticated flows and physical-device checks remain pending because they require a real user session/device.
