---
name: Terrarium White Emerald Mobile
colors:
  background: '#FFFFFF'
  foreground: '#262626'
  card: '#FFFFFF'
  card-foreground: '#262626'
  surface-subtle: '#FAFAFA'
  surface-muted: '#F5F5F5'
  border: '#DBDBDB'
  border-strong: '#C7C7C7'
  muted-foreground: '#737373'
  disabled: '#A8A8A8'
  primary: '#047857'
  primary-hover: '#065F46'
  primary-soft: '#ECFDF5'
  primary-border: '#6EE7B7'
  on-primary: '#FFFFFF'
  destructive: '#B91C1C'
  favorite: '#EF4444'
  favorite-hover: '#DC2626'
  featured: '#EF4444'
  rating: '#B7791F'
  verified: '#1877F2'
  presence: '#31A24C'
  info: '#0284C7'
  listing-sell: '#047857'
  listing-sell-soft: '#ECFDF5'
  listing-liquidation: '#C2410C'
  listing-liquidation-soft: '#FFF7ED'
  listing-giveaway: '#92400E'
  listing-giveaway-soft: '#FFFBEB'
  listing-service: '#0F766E'
  listing-service-soft: '#F0FDFA'
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
  heading:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.01em
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: '0'
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  caption:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 15px
    letterSpacing: '0'
  nav:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: -0.01em
rounded:
  sm: 7.2px
  md: 9.6px
  button: 10px
  lg: 12px
  xl: 16.8px
  2xl: 21.6px
  3xl: 26.4px
  4xl: 31.2px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  gutter: 16px
  lg: 20px
  xl: 24px
  section: 32px
  product-grid-gap: 12px
  mobile-nav-clearance: 96px
---

# Design System: Terrarium White Emerald Mobile

- **Project ID:** `2626960287020872416`
- **Source of truth:** frontend hiện tại trong `apps/web`, commit `5766c5e`
- **Source stack:** Next.js 16, React 19, Tailwind CSS 4, shadcn `base-nova`, Base UI, CVA và Lucide React.
- **Mục đích:** bộ style độc lập để tái sử dụng cho một web mobile khác.

> Tài liệu này mô tả giao diện đang chạy, không mô tả bản thiết kế Phase 0 cũ. Các tài liệu Stitch/Figma ngày 02/08 dùng Be Vietnam Pro và bảng màu “Warm Forest”; frontend hiện tại đã chuyển sang system font, nền trắng, chrome đơn sắc và emerald làm màu hành động.

## 1. Visual Theme & Atmosphere

Terrarium là giao diện marketplace mobile theo tinh thần **white-first, compact và content-first**. Nền trắng, đường viền xám mảnh và chữ gần đen tạo cảm giác quen thuộc như một ứng dụng social commerce. Ảnh sản phẩm, giá và hành động chính được ưu tiên; decoration chỉ xuất hiện dưới dạng nền pastel rất nhẹ cho icon danh mục.

Màu emerald không phủ toàn màn hình. Nó được giữ cho CTA, giá, liên kết quan trọng, focus ring và trạng thái thành công. Phần điều hướng vẫn gần như đơn sắc; tab hoặc nav đang chọn dùng nền xám trung tính thay vì biến toàn bộ chrome thành màu thương hiệu. Độ sâu đến từ border, shadow rất nhẹ và backdrop blur có kiểm soát, không dùng gradient nặng hay glassmorphism trang trí.

### Tính cách thị giác

- Sạch, rõ, thân thiện và có nhịp giống ứng dụng mobile native.
- Premium theo cách tiết chế: ảnh lớn, chữ chắc, không dùng hiệu ứng phô trương.
- Bo tròn mềm nhưng vẫn thực dụng; pill dành cho badge, CTA ngắn và icon button.
- Mật độ tương đối cao nhưng mỗi control quan trọng vẫn có vùng chạm tối thiểu 44 px.
- Nội dung tiếng Việt ngắn, trực tiếp, không dùng thuật ngữ kiểu marketing AI.

### Quy tắc không được phá

- Không biến toàn bộ giao diện thành màu xanh.
- Không dùng emoji làm icon chức năng; ưu tiên Lucide outline.
- Không dùng shadow dày cho card thường.
- Không dùng chữ dưới 11 px; chữ 11 px chỉ dành cho caption và bottom navigation.
- Không dùng màu làm tín hiệu duy nhất cho trạng thái quan trọng.
- Không trộn category và transaction mode thành cùng một loại badge.

## 2. Color Palette & Roles

### Primary Foundation

| Token              | Tên mô tả        |       Hex | Vai trò                            |
| ------------------ | ---------------- | --------: | ---------------------------------- |
| `background`       | Trắng tinh khiết | `#FFFFFF` | Canvas toàn ứng dụng               |
| `card`             | Trắng bề mặt     | `#FFFFFF` | Card, popover, sticky header       |
| `surface-subtle`   | Trắng sứ         | `#FAFAFA` | Search bar, tile nhẹ, vùng xen kẽ  |
| `surface-muted`    | Xám sương        | `#F5F5F5` | Secondary control, skeleton, hover |
| `foreground`       | Than Instagram   | `#262626` | Chữ và icon chính                  |
| `muted-foreground` | Xám metadata     | `#737373` | Chú thích, thời gian, vị trí       |
| `disabled`         | Xám vô hiệu      | `#A8A8A8` | Disabled text/icon                 |
| `border`           | Xám hairline     | `#DBDBDB` | Border mặc định 1 px               |
| `border-strong`    | Xám viền đậm     | `#C7C7C7` | Divider hoặc thumb cần rõ hơn      |

### Accent & Interactive

| Token            | Tên mô tả          |       Hex | Vai trò                         |
| ---------------- | ------------------ | --------: | ------------------------------- |
| `primary`        | Emerald hành động  | `#047857` | CTA, giá, link, focus ring      |
| `primary-hover`  | Emerald sâu        | `#065F46` | Hover/pressed của CTA           |
| `primary-soft`   | Mint rất nhạt      | `#ECFDF5` | Selected surface, soft CTA      |
| `primary-border` | Mint viền          | `#6EE7B7` | Border cho soft emerald control |
| `on-primary`     | Trắng trên emerald | `#FFFFFF` | Chữ/icon trên CTA solid         |

Nguyên tắc sử dụng là khoảng **80% neutral / 15% emerald / 5% semantic accent**. Giá sản phẩm dùng emerald và `font-extrabold`; nav đang chọn dùng neutral, không dùng emerald làm nền.

### Typography & Text Hierarchy

- Chữ chính: `#262626`.
- Chữ phụ: `#737373`.
- Chữ disabled: `#A8A8A8`.
- Chữ đảo trên nền tối/primary: `#FFFFFF`.
- Link chính: `#047857`, semibold; underline chỉ xuất hiện khi hover hoặc ở variant `link`.

### Functional States

| Trạng thái          |       Hex | Cách dùng                             |
| ------------------- | --------: | ------------------------------------- |
| Destructive         | `#B91C1C` | Lỗi, hành động phá hủy, invalid field |
| Favorite / Featured | `#EF4444` | Tim yêu thích, nội dung nổi bật       |
| Favorite hover      | `#DC2626` | Hover/pressed màu đỏ                  |
| Rating              | `#B7791F` | Sao đánh giá, điểm uy tín             |
| Verified            | `#1877F2` | Dấu xác minh nền xanh, glyph trắng    |
| Presence            | `#31A24C` | Chấm online                           |
| Info                | `#0284C7` | Thông tin bản đồ/provider             |
| Success             | `#047857` | Thành công và xác nhận tích cực       |

### Transaction-mode palette

Palette này dùng cho icon tile, lựa chọn và trạng thái hỗ trợ. Badge trên ảnh sản phẩm hiện tại vẫn là trắng/đen để giữ card sạch.

| Mode             | Màu chữ/icon | Nền pastel | Nhãn            |
| ---------------- | -----------: | ---------: | --------------- |
| `SELL`           |    `#047857` |  `#ECFDF5` | Bán             |
| `LIQUIDATION`    |    `#C2410C` |  `#FFF7ED` | Thanh lý        |
| `GIVEAWAY`       |    `#92400E` |  `#FFFBEB` | Cho tặng        |
| `CUSTOM_SERVICE` |    `#0F766E` |  `#F0FDFA` | Setup / dịch vụ |

### Category icon palette

| Category    | Icon color |   Surface |
| ----------- | ---------: | --------: |
| Setup sẵn   |  `#047857` | `#ECFDF5` |
| Bể rỗng     |  `#0369A1` | `#F0F9FF` |
| Cây/rêu     |  `#15803D` | `#F0FDF4` |
| Đất nền     |  `#A16207` | `#FFFBEB` |
| Đá/gỗ/decor |  `#92400E` | `#FFF7ED` |
| Thiết bị    |  `#475569` | `#F8FAFC` |
| Dịch vụ     |  `#0F766E` | `#F0FDFA` |
| Tất cả      |  `#525252` | `#F5F5F5` |

### Optional gamification tier palette

Chỉ dùng nhóm này khi dự án mới thật sự có level/huy hiệu. Không dùng chúng làm màu điều hướng hoặc CTA.

| Tier     |      Base |   Surface |    Border |      Text |
| -------- | --------: | --------: | --------: | --------: |
| Bronze   | `#B7794A` | `#F4E7DB` | `#D8AA82` | `#6B3F28` |
| Silver   | `#7A8791` | `#E9EEF1` | `#B6C1C8` | `#3F4C55` |
| Gold     | `#B08A57` | `#F3E9D6` | `#D8BC8A` | `#6A4A22` |
| Platinum | `#6D8794` | `#E6EEF1` | `#AFC3CC` | `#3E5B68` |
| Diamond  | `#5E7EA8` | `#E5EDF8` | `#A9C3E0` | `#304A70` |

### Optional dark palette

Code có sẵn token dark nhưng chưa có theme switch đang hoạt động. Khi tái sử dụng, hoặc triển khai dark mode đầy đủ và test toàn bộ, hoặc giữ light-only; không ship một dark mode nửa vời.

| Role           |       Hex |
| -------------- | --------: |
| Background     | `#11231B` |
| Card / Popover | `#172A22` |
| Foreground     | `#F5F1E8` |
| Primary        | `#6EE7B7` |
| On primary     | `#082E20` |
| Muted surface  | `#24382E` |
| Muted text     | `#B9C5BC` |
| Border / Input | `#315044` |
| Focus ring     | `#D3B47D` |
| Dark accent    | `#5D472C` |

### Copy-ready CSS tokens

```css
:root {
  --ui-font:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  --color-background: #ffffff;
  --color-card: #ffffff;
  --color-surface-subtle: #fafafa;
  --color-surface-muted: #f5f5f5;
  --color-foreground: #262626;
  --color-muted-foreground: #737373;
  --color-disabled: #a8a8a8;
  --color-border: #dbdbdb;
  --color-border-strong: #c7c7c7;

  --color-primary: #047857;
  --color-primary-hover: #065f46;
  --color-primary-soft: #ecfdf5;
  --color-primary-border: #6ee7b7;
  --color-on-primary: #ffffff;

  --color-destructive: #b91c1c;
  --color-favorite: #ef4444;
  --color-rating: #b7791f;
  --color-verified: #1877f2;
  --color-presence: #31a24c;

  --radius-control: 10px;
  --radius-input: 12px;
  --radius-card: 21.6px;
  --radius-tile: 16.8px;
  --radius-nav: 26px;

  --shadow-floating: 0 8px 24px rgb(38 38 38 / 12%);
  --shadow-primary-floating: 0 6px 18px rgb(4 120 87 / 24%);
  --shadow-bottom-nav: 0 4px 25px rgb(0 0 0 / 8%);
}
```

## 3. Typography Rules

### Font family and character

Frontend hiện tại dùng một **system UI stack**:

```css
font-family:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

Đây là kiểu chữ sans hiện đại, trung tính, đọc tốt ở kích thước nhỏ và không cần tải font từ xa. `font-sans` và `font-heading` đều trỏ về cùng stack để tiêu đề và body giữ chung nhịp Instagram-like. Dấu tiếng Việt phải được kiểm tra trên Windows, Android và iOS.

> Không dùng Be Vietnam Pro nếu mục tiêu là sao chép đúng frontend hiện tại. Be Vietnam Pro chỉ thuộc bộ Stitch/Figma cũ.

### Hierarchy & Weights

| Style       | Size / line-height |          Weight | Cách dùng                             |
| ----------- | ------------------ | --------------: | ------------------------------------- |
| Display     | `24 / 30 px`       |             700 | Tiêu đề màn hình nổi bật, số liệu lớn |
| Heading     | `20 / 26 px`       |             700 | Heading chính trong flow              |
| Title       | `16 / 22 px`       |             600 | Tiêu đề card lớn, mobile header       |
| Title small | `15 / 20 px`       |             600 | Tiêu đề nhóm compact                  |
| Body        | `14 / 20 px`       |             400 | Nội dung mặc định                     |
| Body small  | `13 / 18 px`       |             400 | Nội dung phụ trong card               |
| Meta        | `12 / 16 px`       |         400–600 | Giá trị, vị trí, trạng thái           |
| Caption     | `11 / 15 px`       |         400–500 | Chú thích rất ngắn                    |
| Navigation  | `11 / 14 px`       | 500; active 700 | Bottom navigation                     |

### Typography behavior

- Heading và giá dùng `tracking-tight`; eyebrow viết hoa dùng `tracking-wider`.
- Product title dùng 14 px, weight 600, line-height snug và tối đa hai dòng.
- Giá dùng weight 800, số dạng `tabular-nums`, màu primary.
- Body dài dùng line-height 1.4–1.5; không dùng caption cho đoạn văn.
- Chữ trên button dùng 14 px, weight 600.
- Label form luôn hiển thị; placeholder không thay thế label.

## 4. Component Stylings

### Buttons

#### Kích thước chuẩn

- Default: cao 48 px, padding ngang 16 px, gap 8 px, radius 10 px.
- Small: cao 44 px, padding ngang 12 px, radius 9 px.
- Extra-small vẫn phải có `min-height: 44px` trên mobile.
- Icon-only: 44 × 44 px; icon 16–20 px.
- Large/icon-large: 48 px.
- Text: 14 px semibold; CTA compact trong product card là 12 px semibold.

#### Variants

| Variant           | Nền        | Chữ / border                  | Hover                        |
| ----------------- | ---------- | ----------------------------- | ---------------------------- |
| Primary           | `#047857`  | Trắng, border emerald         | Emerald sâu hoặc 90% opacity |
| Outline           | Trắng      | `#262626`, border `#DBDBDB`   | Nền `#F5F5F5`                |
| Secondary         | `#F5F5F5`  | `#262626`                     | Tối hơn rất nhẹ              |
| Ghost             | Trong suốt | `#262626`                     | Nền `#F5F5F5`                |
| Destructive       | Đỏ 10%     | `#B91C1C`                     | Đỏ 20%                       |
| Link              | Trong suốt | `#047857`                     | Underline                    |
| Soft commerce CTA | `#ECFDF5`  | Emerald đậm, border `#6EE7B7` | Mint đậm hơn                 |

#### States

- Focus-visible: border primary + ring 3 px ở 50% opacity.
- Pressed: dịch xuống 1 px hoặc scale `0.95`; icon button có thể scale `0.90`.
- Disabled: opacity 50%, cursor disabled, không nhận pointer event.
- Loading: giữ nguyên bề rộng, khóa tương tác, hiển thị `LoaderCircle` 16 px và nhãn “Đang xử lý…”.
- Invalid/destructive focus dùng màu destructive, không dùng primary ring.
- Transition 150–200 ms; tắt transition không cần thiết khi `prefers-reduced-motion`.

### Iconography

**Thư viện:** Lucide React. Icon là outline, đầu nét tròn, không trộn nhiều bộ icon.

| Ngữ cảnh                  | Kích thước |        Stroke |
| ------------------------- | ---------: | ------------: |
| Inline trong button/input |      16 px | mặc định 2 px |
| Icon chức năng chuẩn      |      20 px |        2.2 px |
| Back/hero control         |   20–24 px |      2–2.5 px |
| Metadata/badge            |   12–14 px |      2–2.2 px |
| Bottom nav inactive       |      20 px |        1.8 px |
| Bottom nav active         |      20 px |        2.4 px |
| Selected check trong menu |      12 px |          3 px |

#### Mapping nên tái sử dụng

- Navigation: `Home`, `Search`, `SquarePlus`, `Send`, `UserRound`.
- Commerce mode: `ShoppingBag`, `Tag`, `Gift`, `Wrench`.
- Category: `Sparkles`, `Box`, `Leaf`, `Layers3`, `Mountain`, `Settings2`, `LayoutGrid`.
- Trust/status: `CheckCircle2`, `Star`, `ShieldCheck`, `Bell`, `Heart`, `MapPin`, `Clock`.
- Utility: `ChevronLeft`, `ChevronRight`, `ChevronDown`, `SlidersHorizontal`, `X`, `LoaderCircle`.

Chỉ fill icon khi trạng thái cần nhận biết ngay: tim active màu đỏ, sao rating, sao featured hoặc check verified nền xanh. Icon-only button phải có tên truy cập (`aria-label`); icon trang trí phải ẩn khỏi screen reader.

### Cards & Containers

- Card nền trắng, border 1 px `#DBDBDB`, text `#262626`.
- Primitive card dùng radius khoảng 16.8 px; marketplace/product card dùng radius khoảng 21.6 px.
- Padding thường 12–16 px; card compact 10–12 px.
- Shadow mặc định là `2xs/xs`; chỉ tăng nhẹ khi hover hoặc cho floating surface.
- Hover desktop: nâng card khoảng 2 px, border đậm hơn, ảnh scale 1.05 trong 300 ms.
- Không dùng page-shell shadow; giữ elevation cho dialog, popover và bottom nav.
- Skeleton dùng nền muted và shimmer 1.5 giây; giảm motion thành trạng thái tĩnh.

### Navigation

#### Bottom navigation

- Fixed, cách đáy 12 px, rộng `calc(100% - 24px)`, tối đa 512 px.
- Cao 64 px, năm cột, padding ngang 12 px, radius 26 px.
- Nền trắng 95% + backdrop blur; border xám mảnh; shadow `0 4px 25px rgb(0 0 0 / 8%)`.
- Item active dùng nền neutral khoảng `#E5E5E5`, chữ gần đen và weight 700.
- Item inactive dùng `#737373`; hover chuyển về foreground.
- Mỗi item có icon 20 px, nhãn 11 px và vùng chạm tối thiểu 44 px.

#### Sticky header

- Nền card trắng, border-bottom, backdrop blur nhẹ, z-index cao.
- Nội dung căn giữa trong `max-width: 512px`, padding ngang 16 px.
- Mobile page header cao 56 px; back button tròn 44 px.

### Inputs & Forms

- Input cao 44 px; border 1 px `#DBDBDB`; radius 12 px; padding ngang 12 px.
- Search input dùng nền `#FAFAFA`, radius khoảng 16.8 px và icon 16 px bên trái.
- Focus-visible: border `#047857` + ring 3 px emerald 50%.
- Placeholder và helper text dùng `#737373`.
- Disabled dùng nền input 50% và opacity 50%.
- Invalid dùng border/ring `#B91C1C`, helper text cùng màu và `aria-invalid`.
- Textarea tối thiểu 64 px, padding 10–12 px.
- Select/menu dùng popover trắng, radius 12 px, shadow nhỏ; option đang chọn có check trắng trên vòng tròn emerald.
- Mobile form luôn giữ label, helper/error và dữ liệu đã nhập sau validation lỗi.

### Badges, chips and status

- Badge mặc định cao 20 px, radius full, padding ngang 8 px, text 12 px medium.
- Listing-mode badge trên ảnh: nền trắng 95%, chữ/icon neutral đậm, border neutral, icon 12 px. Đây là lựa chọn có chủ đích để card không thành “cầu vồng”.
- Status quan trọng phải có icon + text + semantic color.
- Verified: check xanh Facebook `#1877F2` với glyph trắng.
- Favorite: tim đỏ `#EF4444`; inactive trên ảnh dùng trắng + drop shadow để đọc được.
- Rating: sao fill màu `#B7791F`.
- Presence: chấm xanh `#31A24C`, luôn đi cùng trạng thái có thể hiểu bằng text/label.

### Product card

- Mobile grid mặc định hai cột, gap 12 px.
- Ảnh vuông, full-bleed, `object-fit: cover`; overlay badge góc trái và favorite góc phải.
- Tiêu đề 14 px semibold, tối đa hai dòng, block cao ổn định giữa các card.
- Metadata 12 px; icon 12–14 px.
- Giá emerald, weight 800, số tabular; giá cũ destructive + gạch ngang.
- Divider mảnh trước price/action row.
- CTA compact dạng pill, nền mint, chữ emerald đậm.
- Khi card hẹp dưới khoảng 170 px, price và CTA xếp dọc thay vì cắt chữ.
- Horizontal variant dùng ảnh 112 × 112 px, radius 16.8 px và nội dung flex bên phải.

### Category shortcut tile

- Bốn cột trên mobile, gap 8 px, card cha padding 16 px.
- Tile có nền subtle, border nhẹ, radius 16.8 px và padding 8 px.
- Icon nằm trong ô 44 × 44 px với nền pastel theo category.
- Tên category 12 px bold; subtitle 11 px muted, đều tối đa một dòng.

### Dialog, sheet and overlay

- Dialog căn giữa, cách mép mobile 16 px, radius 16.8 px, padding 16 px.
- Overlay đen 10% + blur rất nhẹ; animation fade/zoom 100 ms.
- Bottom sheet dùng cho filter và picker; slide 200 ms, shadow lớn hơn card.
- Close control là ghost icon button 44 px, có nhãn truy cập.

## 5. Layout Principles

### Grid & Structure

- Mobile-first từ 320 px; checkpoint thực tế: 320, 360, 375, 390 và 430 px.
- App shell căn giữa, `max-width: 512px`, có border hai bên khi màn hình rộng.
- Gutter trang: 16 px.
- Product grid: hai cột, gap 12 px.
- Section stack: 16–24 px; section lớn có thể 32 px.
- Nội dung chừa `padding-bottom: 96px` để không bị bottom nav che.
- Admin là ngoại lệ desktop; style mobile tái sử dụng không cần kéo admin grid vào app mới.

### Whitespace Strategy

Hệ thống dựa trên nhịp 4 px, có half-step 6/10/14 px cho mobile compact:

`4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 48, 64, 96`.

Trong card ưu tiên 10–16 px; giữa section ưu tiên 20–24 px. Không nén touch target chỉ để nhét thêm nội dung.

### Alignment & Visual Balance

- Text mặc định căn trái; center chỉ dùng cho empty state, trust tile và xác nhận ngắn.
- Ảnh là trọng tâm thị giác; chrome giữ neutral để không tranh sự chú ý.
- Heading thường có icon inline 16 px, không đặt trong hộp màu riêng nếu không có chức năng.
- Giá và CTA căn về đáy card để các card cùng hàng có nhịp ổn định.
- Một vùng chỉ có một primary action rõ ràng.

### Responsive Behavior & Touch

- Tailwind breakpoints chuẩn: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536` px.
- Các tinh chỉnh mobile quan trọng dùng mốc 360/390 px và container query 170 px.
- Touch target tối thiểu 44 × 44 px; CTA chính 48 px.
- Dùng `touch-action: manipulation` và bỏ tap highlight mặc định.
- Tôn trọng safe-area inset ở đáy.
- Không để sticky CTA, chat composer hoặc bottom sheet nằm dưới bottom nav.

### Motion

- Micro-interaction: 150–200 ms.
- Page entry: fade + slide rất nhẹ khoảng 250 ms.
- Image hover: 300 ms; chỉ có tác dụng ở thiết bị có hover.
- Pressed scale: 0.90–0.98 tùy control.
- Skeleton shimmer: 1.5 giây.
- OTP invalid shake: 360 ms.
- Bắt buộc hỗ trợ `prefers-reduced-motion`.

### Imagery

- Product image dùng tỷ lệ vuông trong grid; detail có thể dùng gallery lớn.
- Dùng ảnh terrarium thật, nhiều texture tự nhiên, ánh sáng rõ và background không quá bận.
- Luôn có loading skeleton và error fallback cùng kích thước để tránh layout shift.
- Không dùng icon/ảnh từ URL không kiểm soát; ảnh remote phải có dimensions và responsive `sizes`.

## 6. Design System Notes for Stitch Generation

### Language to Use

Các cụm từ nên dùng trong prompt thiết kế:

> white-first mobile marketplace, Instagram-like monochrome chrome, restrained emerald commerce accent, thin neutral borders, compact two-column product grid, pastel category icon tiles, subtle elevation, native-like 44px touch targets, system UI typography, Vietnamese content, accessible focus and state feedback

Tránh các cụm: “luxury gradient”, “glassmorphism everywhere”, “neon”, “purple AI”, “oversized desktop hero”, “floating card for every section”.

### Color References

- Canvas/card: pure white `#FFFFFF`.
- Text: charcoal `#262626`; metadata `#737373`.
- Border: hairline gray `#DBDBDB`.
- Commerce action/price: emerald `#047857`.
- Selected soft surface: mint `#ECFDF5`.
- Favorite/featured: vivid red `#EF4444`.
- Verified: social blue `#1877F2`.
- Category color chỉ nằm trong icon tile pastel; không nhuộm toàn card.

### Component Prompts

1. **Mobile home:** “Tạo trang marketplace mobile rộng 390 px, nền trắng, sticky search header, card danh mục bốn cột với icon Lucide trên nền pastel, grid sản phẩm hai cột gap 12 px và floating five-item bottom navigation màu neutral.”
2. **Product card:** “Tạo card ảnh vuông, radius khoảng 22 px, border xám mảnh, badge mode trắng/đen trên ảnh, favorite đỏ ở góc phải, title hai dòng, metadata nhỏ, giá emerald đậm và soft-mint pill CTA ở hàng cuối.”
3. **Mobile form:** “Tạo form white-first với label luôn hiển thị, input cao 44 px radius 12 px, emerald focus ring, inline validation màu đỏ, primary button cao 48 px và bottom sheet cho lựa chọn dài.”

### Incremental Iteration

1. Khóa token nền, font và radius trước.
2. Dựng shell 390 px, sticky header và bottom nav.
3. Dựng Button/Input/IconButton rồi mới dựng card.
4. Kiểm tra product grid ở 320/375/430 px.
5. Thêm loading, empty, error, disabled, pressed và focus-visible.
6. Cuối cùng mới thêm motion và optional dark mode.

### Porting checklist for another mobile web

- Copy token CSS và font stack.
- Dùng Lucide cho toàn bộ icon chức năng.
- Giữ page gutter 16 px, grid gap 12 px và touch target 44 px.
- Tạo đúng sáu button variants trước khi style từng page.
- Dùng neutral active state cho navigation, emerald cho commerce action.
- Tách category palette khỏi status/transaction palette.
- Kiểm tra tối thiểu 320, 375, 390 và 430 px.
- Kiểm tra keyboard focus, reduced motion và nội dung tiếng Việt dài.

## 7. Known Exceptions in the Current Repository

- `apps/web/app/icon.svg` vẫn dùng Messenger blue `#0084FF`; đây là asset legacy và không đại diện cho primary emerald hiện tại. Khi port sang dự án mới, hãy vẽ lại app icon theo primary mới hoặc coi màu xanh này là accent riêng có chủ đích.
- Dark tokens đã tồn tại nhưng không tìm thấy runtime theme switch; light theme mới là trạng thái đã ship.
- `FavoriteButton` hiện có wrapper compact 28/32/36 px và primitive `Select` có mode 28/32 px. Khi port, giữ glyph nhỏ nhưng mở hit area của control mobile lên tối thiểu 44 px.
- Stitch/Figma Phase 0 cũ dùng Be Vietnam Pro và warm-neutral surfaces. Không trộn bộ đó vào implementation này nếu chưa chủ động tạo một redesign mới.
- File này chỉ được trích xuất và cập nhật trong repository; chưa được upload lại vào Stitch design-system asset.
