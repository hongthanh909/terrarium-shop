# Fix Mobile UI

Cap nhat sau khi cai skill `ui-ux-pro-max` va audit nhanh code trong `apps/web`.

## Da fix truoc do

1. Product detail mobile sticky bar: gia bi loi ky tu va nut them gio bi vo chu.
   - File: `apps/web/app/products/[slug]/ProductDetailClient.tsx`
   - Trang thai: da sua format gia, them `whitespace-nowrap`, font-size linh hoat va button co icon.

2. Home hero mobile: anh banner bi cat qua nhieu tren viewport doc.
   - File: `apps/web/app/page.tsx`
   - Trang thai: da dung lop anh nen cover + lop anh chinh contain tren mobile.

3. Home hero CTA mobile: button co kich thuoc cung, de chen nhau tren man nho.
   - File: `apps/web/app/page.tsx`
   - Trang thai: da giam min-width va cho nut phu linh hoat hon tren mobile.

4. Chatbox AI: launcher, goi y nhanh, loading state va Ctrl+wheel zoom.
   - File: `apps/web/components/ChatWidget.tsx`
   - Trang thai: da doi launcher sang robot icon, xoa quick suggestion pills, them loading 3 cham ben trai, giam size mac dinh va them Ctrl + lan chuot de zoom UI trong khung.

## Can uu tien fix tiep

## Da fix trong luot nay

1. Chatbox product cards da scale theo `--cw-scale`.
   - File: `apps/web/components/ChatWidget.tsx`
   - Da sua: anh san pham dung `ImageWrapper`, card/image/title/meta/price/badge/action button co class fluid, fallback dung icon Lucide thay emoji, avatar assistant dung Bot icon, action hit-area toi thieu 44px.

2. Chatbox reduced motion.
   - File: `apps/web/components/ChatWidget.tsx`
   - Da sua: them media query `prefers-reduced-motion` de tat nudge/pulse/hover transform va giam transition.

3. Product detail gallery/lightbox.
   - File: `apps/web/app/products/[slug]/ProductDetailClient.tsx`
   - Da sua: main image, lightbox image va thumbnail dung `ImageWrapper`; nut close/zoom/reset co hit-area 44px va focus ring.

4. Cart drawer touch targets.
   - File: `apps/web/components/Header.tsx`, `apps/web/app/products/[slug]/ProductDetailClient.tsx`
   - Da sua: nut tang/giam/xoa gio hang len hit-area 44px, icon lon hon va co focus ring/aria-label.

5. Keyboard skip link.
   - File: `apps/web/app/ShopLayout.tsx`
   - Da sua: them skip link toi `#main-content` va gan `id` cho main.

### P0 - Loi de gay vo UI mobile

1. Chatbox van con nhieu block dung size co dinh va raw `img`.
   - File: `apps/web/components/ChatWidget.tsx`
   - Vi tri thay duoc: raw `<img>` o cac dong gan 749, 912, 965, 1010; product card trong chat dung text `8px`, `12px`, icon `w-7 h-7`.
   - Trang thai: da xu ly cac card san pham va avatar assistant trong chat. Con lai: can audit tiep cac text/action nho o header chat neu muon polish them.

2. Product detail gallery/lightbox con raw `<img>` va nut zoom nho.
   - File: `apps/web/app/products/[slug]/ProductDetailClient.tsx`
   - Vi tri thay duoc: raw `<img>` o cac dong gan 487, 497, 588, 654; nut zoom `w-8 h-8`.
   - Trang thai: da xu ly main image, lightbox image, thumbnails va nut zoom/close/reset.

3. Cart drawer quantity/remove buttons qua nho.
   - File: `apps/web/components/Header.tsx`
   - Vi tri thay duoc: nut giam/tang/xoa gio hang `w-6 h-6` gan dong 519, 523, 526.
   - Trang thai: da xu ly trong cart drawer header va cart sheet product detail.

4. Nhieu text qua nho duoi nguong doc mobile.
   - File chinh: `Header.tsx`, `Footer.tsx`, `ChatWidget.tsx`, `ProductDetailClient.tsx`, `product-card.tsx`, cac trang checkout/orders.
   - Dau hieu: co `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[12px]` o nhieu noi.
   - Trang thai: da xu ly text/card san pham trong chat. Con lai: cac badge/voucher/status nho trong product detail, header, checkout/orders can audit tiep.

### P1 - Chatbox va interaction quality

5. Chatbox resize/zoom can dong bo toan bo UI ben trong.
   - File: `apps/web/components/ChatWidget.tsx`
   - Van de: mot so card san pham, sale badge, nut mui ten van dung px co dinh nen khi resize/zoom co the khong dong bo.
   - Trang thai: da them token noi bo cho product card, product image, title, meta, price, sale badge va action button. Con lai: co the token hoa tiep message bubble/header/input.

6. Chatbox can kiem tra safe-area va overlap voi bottom sticky UI.
   - File: `apps/web/components/ChatWidget.tsx`, `apps/web/app/products/[slug]/ProductDetailClient.tsx`
   - Van de: launcher fixed co the de len sticky add-to-cart hoac thumbnail tren product page.
   - Huong fix: dung CSS variable offset theo route/product page, them `env(safe-area-inset-bottom)`, clamp vi tri bubble/panel theo viewport.

7. Motion chua dong bo `prefers-reduced-motion`.
   - File chinh: `apps/web/app/page.tsx`, `apps/web/app/explore/ExploreClient.tsx`, `apps/web/components/ui/hero-carousel.tsx`, `apps/web/components/Header.tsx`, `ChatWidget.tsx`
   - Van de: nhieu animation/framer/marquee/hover scale; chi mot so component da co reduced-motion.
   - Trang thai: da xu ly rieng cho chatbox. Con lai: homepage/header/marquee/explore animation.

### P2 - Consistency va accessibility

8. Raw hex va inline styles qua nhieu component.
   - File chinh: `Header.tsx`, `Footer.tsx`, `ChatWidget.tsx`, `app/page.tsx`, `ProductDetailClient.tsx`
   - Van de: mau xanh/be/gray bi lap lai bang raw hex, kho giu contrast va dark/light consistency.
   - Huong fix: dua ve token CSS/theme: `brand`, `brand-foreground`, `surface-botanical`, `surface-warm`, `border-soft`, `price`, `sale`.

9. Focus state con noi dung `focus:outline-none` khong phai luc nao cung co `focus-visible`.
   - File chinh: `Header.tsx`, cac form admin, cac trang auth.
   - Huong fix: chuan hoa class focus cho button/input/link: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425733] focus-visible:ring-offset-2`.

10. Thieu skip link cho keyboard user.
   - File: `apps/web/app/layout.tsx`, `apps/web/app/ShopLayout.tsx`
   - Van de: co `<main>` nhung chua thay skip-to-content link.
   - Trang thai: da xu ly trong `ShopLayout.tsx`.

11. Mot so raw `<img>` ngoai chat nen doi sang `ImageWrapper`.
   - File vi du: `apps/web/app/page.tsx`, `apps/web/app/blog/BlogClient.tsx`, `apps/web/app/blog/[slug]/page.tsx`, `apps/web/app/profile/page.tsx`, `apps/web/components/ui/review-marquee.tsx`.
   - Huong fix: dung `ImageWrapper`/`next/image`, khai bao width/height hoac fill + parent aspect-ratio, chi dat priority cho LCP/hero.

12. Admin mobile co nhieu action icon 28-32px.
   - File chinh: `apps/web/app/tiem-nho-nth24/**`
   - Van de: admin co nhieu button `w-7 h-7`, `w-8 h-8`; tren tablet/mobile de bam nham.
   - Huong fix: tang hit-area len 40-44px, giu icon 16-18px; uu tien categories, vouchers, products create/edit.

## Checklist test lai sau khi fix

- Test viewport: 320, 375, 390, 430, 768, landscape mobile.
- Test iOS Safari va Chrome mobile emulation.
- Test zoom browser 125%-150% va dynamic text lon.
- Test reduced motion.
- Test product detail: gallery, sticky bar, chatbox, cart drawer.
- Test home: hero, service strip, CTA, chat launcher.
- Test keyboard tab: header, cart drawer, search, chatbox, modal.
