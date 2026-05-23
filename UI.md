# Terrarium Shop - UI FIX PLAN (Tiếng Việt)

## Mục tiêu
1. ✅ Giữ nguyên icons (không bị random/missing)
2. ✅ Dịch toàn bộ giao diện sang tiếng Việt
3. ✅ Cải thiện cấu trúc: font, spacing, button sizes, typography
4. ✅ Loại bỏ feeling "AI-generated"

---

## 🔧 **NHỮNG GÌ CẦN FIX NGAY**

### **1. Footer Component - Icon Issue**

**Vấn đề:** Icon không hiển thị đúng do dùng `label` thay vì `type`

**File:** `apps/web/components/Footer.tsx`

**Fix:**
```tsx
// THAY THẾ iconMap hiện tại bằng:
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  phone: Phone,
  address: MapPin,
  working_hours: Clock,
  social: MessageCircle, // default cho social
};

// Trong phần render social items:
{socialItems.map((item: any) => {
  // Dùng item.label để xác định platform cụ thể
  const getIcon = () => {
    switch (item.label.toLowerCase()) {
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      case 'tiktok': return TikTok;
      case 'twitter': return Twitter;
      default: return Share2;
    }
  };
  const Icon = getIcon();
  return (
    <a key={idx} href={item.value} ...>
      <Icon className="w-4 h-4" />
    </a>
  );
})}
```

---

### **2. Typography Recommendations**

#### **Font chữ hiện tại:**
- Đang dùng: **Nunito** (round, friendly) ✅ GOOD
- Có thể thêm: **Inter** cho body text (more readable)
- Giữ **Playfair Display** cho taglines/quotes

**Cải tiến:**

**File:** `apps/web/app/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

@layer base {
  body {
    font-family: 'Inter', sans-serif; /* Thay Nunito bằng Inter cho body */
    line-height: 1.6;
    letter-spacing: 0.01em;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Nunito', sans-serif; /* Headings dùng Nunito */
    font-weight: 700;
    letter-spacing: -0.02em; /* Tighter tracking cho headings */
    line-height: 1.2;
  }

  .font-serif {
    font-family: 'Playfair Display', serif;
  }
}
```

**Tailwind config:**
```js
fontFamily: {
  sans: ['Inter', 'Nunito', 'sans-serif'], // Fallback chain
  heading: ['Nunito', 'sans-serif'],
  display: ['Playfair Display', 'serif'],
}
```

---

### **3. Button Sizes & Spacing**

#### **Current Issues:**
- Button sizes không consistent
- Padding không uniform
- Border-radius quá lớn/không đồng đều

#### **Recommendations:**

**File:** `apps/web/components/ui/button.tsx`

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[hsl(145,35%,68%)] text-[hsl(145,40%,25%)] hover:bg-[hsl(145,35%,60%)] shadow-soft hover:shadow-soft-lg",
        destructive: "bg-[hsl(0,75%,55%)] text-white hover:bg-[hsl(0,75%,45%)] shadow-soft",
        outline: "border-2 border-primary/30 bg-transparent hover:bg-primary/10 hover:border-primary/50",
        secondary: "bg-[hsl(145,35%,92%)] text-[hsl(145,40%,45%)] hover:bg-[hsl(145,35%,85%)]",
        ghost: "hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // CONSISTENT SIZES
        xs: "h-7 px-3 text-xs font-medium rounded-lg",   // 28px height
        sm: "h-8 px-4 text-sm font-medium rounded-lg",   // 32px
        default: "h-10 px-5 text-sm font-semibold rounded-xl", // 40px
        md: "h-11 px-6 text-base font-semibold rounded-xl", // 44px
        lg: "h-12 px-8 text-base font-semibold rounded-xl", // 48px
        xl: "h-14 px-10 text-lg font-bold rounded-2xl",    // 56px
        icon: "h-10 w-10 rounded-full",                   // 40px circle
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

**Key changes:**
- `rounded-xl` (12px) thay `rounded-full` cho regular buttons
- `rounded-2xl` (16px) cho XL buttons
- Icon buttons: `rounded-full` (circle)
- Consistent height: xs=28, sm=32, default=40, md=44, lg=48, xl=56

---

### **4. Card Component Improvements**

**File:** `apps/web/components/ui/card.tsx`

```tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl bg-card text-card-foreground shadow-soft border-0 overflow-hidden", // Added overflow-hidden
      className
    )}
    {...props}
  />
));

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)} // p-6 = 24px padding
    {...props}
  />
));

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
```

**Card content spacing:**
- Header padding: `p-6` (24px)
- Content padding: `p-6 pt-0` (24px, no top)
- Footer padding: `p-6 pt-0`

---

### **5. Spacing Scale (Tailwind)**

**File:** `apps/web/tailwind.config.js`

Thêm custom spacing:

```js
theme: {
  extend: {
    spacing: {
      '18': '4.5rem',   // 72px
      '22': '5.5rem',   // 88px
      '26': '6.5rem',   // 104px
    },
    borderRadius: {
      'xl': '0.75rem',  // 12px
      '2xl': '1rem',    // 16px
      '3xl': '1.5rem',  // 24px
    }
  }
}
```

**Sử dụng trong components:**
- Section padding: `py-24` (96px) → `py-22` (88px) cho nhẹ hơn
- Container max-width: `max-w-7xl` → `max-w-6xl` cho focus hơn
- Grid gap: `gap-8` → `gap-10` (40px) cho thoáng

---

### **6. Homepage Content Translation**

**File:** `apps/web/app/page.tsx`

**Cần dịch tiếng Anh → Việt:**

```tsx
// BEFORE:
<h1>Bring Nature Indoors</h1>
<p>Discover our handcrafted terrariums...</p>
<Badge>Handcrafted Mini Ecosystems</Badge>

// AFTER:
<h1>Mang Thiên Nhiên Vào Trong Nhà</h1>
<p>Khám phá bộ sưu tập terrarium thủ công của chúng tôi...</p>
<Badge>Hệ Sinh Thái Thu Nhỏ Được Tạo Tình</Badge>
```

**Danh sách translate cần làm:**

| English | Vietnamese |
|---------|------------|
| "Bring Nature Indoors" | "Mang Thiên Nhiên Vào Nhà" |
| "Discover our handcrafted..." | "Khám phá bộ sưu tập terrarium thủ công..." |
| "Handcrafted Mini Ecosystems" | "Hệ Sinh Thái Thu Nhỏ Được Tạo Tình" |
| "Shop Now" | "Mua Ngay" |
| "Learn More" | "Tìm Hiểu Thêm" |
| "Happy Customers" | "Khách Hàng Hài Lòng" |
| "Unique Designs" | "Thiết Kế Độc Bản" |
| "Average Rating" | "Đánh Giá Trung Bình" |
| "Why Choose Us" | "Tại Sao Chọn Chúng Tôi" |
| "Eco-Friendly" | "Thân Thiện Môi Trường" |
| "Free Delivery" | "Miễn Phí Vận Chuyển" |
| "Quality Guarantee" | "Bảo Đảm Chất Lượng" |
| "Handpicked For You" | "Được Lựa Chọn Cho Bạn" |
| "Featured Products" | "Sản Phẩm Nổi Bật" |
| "View All" | "Xem Tất Cả" |
| "Customer Love" | "Khách Hàng Nói Gì" |
| "What People Are Saying" | "Lời Đánh Giá" |
| "About Our Terrariums" | "Về Terrarium Của Chúng Tôi" |
| "Explore Our Collection" | "Khám Phá Bộ Sưu Tập" |

---

### **7. Button Text Translation**

**File:** `components/Header.tsx`, `app/page.tsx`, etc.

```tsx
// Header.tsx
{ href: "/products", label: "Sản phẩm" },
{ href: "/explore", label: "Khám phá" },
{ href: "/blog", label: "Blog" },
// Không còn "Tư vấn" - đã chuyển thành chat bubble

// Dropdown "Chính sách"
"Bảo hành", "Vận chuyển", "Đổi trả", "Bảo mật", "Câu hỏi thường gặp"

// Cart Sheet
"Shopping Cart" → "Giỏ hàng"
"Review your items..." → "Xem lại đơn hàng..."
"Proceed to Checkout" → "Thanh toán"
"Continue Shopping" → "Tiếp tục mua sắm"

// Homepage
"Shop Now" → "Mua Ngay"
"Learn More" → "Tìm Hiểu Thêm"
"View All" → "Xem Tất Cả"
```

---

### **8. Chat Widget - Language**

**File:** `components/ChatWidget.tsx`

```tsx
// Vietnamese:
<DialogTitle className="...">
  Tư vấn trực tiếp
</DialogTitle>

<div className="text-center ...">
  <p className="font-medium mb-1">Chào bạn! 👋</p>
  <p className="text-xs">
    Hãy chia sẻ nhu cầu của bạn, chúng tôi sẽ tư vấn trong thời gian sớm nhất.
  </p>
</div>

<Textarea
  placeholder="Nhập câu hỏi của bạn..."
  ...
/>

<div className="mt-4 text-center">
  <p className="text-xs ...">
    Hoặc gọi trực tiếp:{" "}
    <a href="tel:0909xxx" className="font-bold ...">
      0909.xxx.xxx
    </a>
  </p>
</div>
```

---

### **9. Policies Pages - Already Vietnamese ✅**

File `app/policies/page.tsx` và `[slug]/page.tsx` đã dịch tiếng Việt rồi.

**Nhưng cần fix:** Accordion content HTML nên giữ nguyên `<br/>` thay vì replace:

```tsx
// THAY NÀY:
<div dangerouslySetInnerHTML={{ __html: policy.content.replace(/\n/g, '<br/>') }} />

// THÀNH:
<div dangerouslySetInnerHTML={{ __html: policy.content }} />
```

Và trong DB, content nên lưu sẵn HTML (with `<p>`, `<h2>`, `<ul>` tags).

---

### **10. Contact API - Data Structure**

**File:** `apps/web/app/api/contact/route.ts`

Prisma query hiện tại:

```ts
const contactInfo = await prisma.contactInfo.findMany({
  where: { isActive: true }, // ❌ Sai field name
  orderBy: { orderIndex: "asc" }, // ❌ Sai field name
});
```

**FIX:** Prisma schema dùng `is_active` và `order_index` (snake_case):

```ts
const contactInfo = await prisma.contactInfo.findMany({
  where: { is_active: true },
  orderBy: { order_index: 'asc' },
});
```

---

## 🎨 **TYPOGRAPHY HIỆN TƯỢNG**

### **Font Pairing Recommendation:**

```
Primary (Headings):   Nunito SemiBold (600) / Bold (700)
Body (Paragraphs):    Inter Regular (400) / Medium (500)
Accent (Quotes):      Playfair Display Italic
Monospace (Code):     JetBrains Mono (nếu cần)
```

### **Font Size Scale (Tailwind):**

```txt
text-xs:   12px   - Caption, helper text
text-sm:   14px   - Body text, button text
text-base: 16px   - Base body, small headings
text-lg:   18px   - Subheadings
text-xl:   20px   - Card titles
text-2xl:   24px   - Section titles
text-3xl:   30px   - Page titles
text-4xl:   36px   - Hero headings
text-5xl:   48px   - Hero main title
text-6xl:   60px   - Hero big title
```

### **Line Height:**

```css
leading-tight:   1.2  - Headings
leading-snug:    1.4  - Subheadings
leading-normal:  1.5  - Body text
leading-relaxed: 1.6  - Long paragraphs
```

---

## 📐 **SPACING SYSTEM**

### **Section Padding:**

```tsx
// Hero section - rộng thoáng
<section className="py-24 md:py-32 px-6">  {/* 96-128px vertical */}

// Content sections
<section className="py-16 md:py-20 px-6"> {/* 64-80px vertical */}

// Compact sections
<section className="py-12 px-6">  {/* 48px vertical */}
```

### **Container Width:**

```tsx
// Full width with padding
<div className="max-w-7xl mx-auto px-6">  {/* 1152px max, 24px gutter */}

// More focused
<div className="max-w-6xl mx-auto px-6">  {/* 960px max, tighter focus */}

// Narrow for reading
<div className="max-w-3xl mx-auto px-6">  {/* 672px max, optimal reading */}
```

### **Component Gap:**

```tsx
// Button groups
<div className="flex gap-4">  {/* 16px gap */}

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">  {/* 32px gap */}

// List items
<ul className="space-y-3">  {/* 12px gap */}
```

---

## 🔘 **BUTTON STYLES - COMPLETE SYSTEM**

```tsx
// sizes: xs, sm, default, md, lg, xl, icon
// variants: default, secondary, outline, ghost, destructive

// DEFAULT (Primary)
className="bg-[hsl(145,35%,68%)] text-[hsl(145,40%,25%)] hover:bg-[hsl(145,35%,60%)] shadow-soft hover:shadow-soft-lg"

// SECONDARY (Muted)
className="bg-[hsl(145,35%,92%)] text-[hsl(145,40%,45%)] hover:bg-[hsl(145,35%,85%)]"

// OUTLINE
className="border-2 border-primary/30 bg-transparent hover:bg-primary/10 hover:border-primary/50"

// GHOST
className="hover:bg-primary/10 hover:text-primary"

// DESTRUCTIVE
className="bg-[hsl(0,75%,55%)] text-white hover:bg-[hsl(0,75%,45%)] shadow-soft"

// SIZES:
// xs: h-7 px-3 text-xs
// sm: h-8 px-4 text-sm
// default: h-10 px-5 text-sm font-semibold rounded-xl
// md: h-11 px-6 text-base
// lg: h-12 px-8 text-base
// xl: h-14 px-10 text-lg font-bold rounded-2xl
// icon: h-10 w-10 rounded-full (always circle)
```

---

## 🗂️ **FULL TO-DO CHECKLIST**

### **Phase 1: Critical Fixes (1-2h)**

- [ ] **Fix Footer icon mapping** - dùng `type` + switch case cho social icons
- [ ] **Fix Contact API** - đổi `isActive` → `is_active`, `orderIndex` → `order_index`
- [ ] **Update Prisma schema** - đã có, nhưng verify field names match
- [ ] **Translate all English text** trong:
  - [ ] Header nav links ( Products → Sản phẩm )
  - [ ] Homepage hero & sections
  - [ ] Button texts (Shop Now → Mua Ngay)
  - [ ] Footer links
  - [ ] Chat widget
  - [ ] Cart drawer
  - [ ] Policies (đã xong)
  - [ ] Any remaining English

### **Phase 2: Typography (30min)**

- [ ] Update `globals.css` với Inter font cho body
- [ ] Update `tailwind.config.js` font family
- [ ] Apply consistent heading weights (font-bold, font-semibold)
- [ ] Set line-height utilities

### **Phase 3: Button System (1h)**

- [ ] Update `button.tsx` với size system mới (xs, sm, default, md, lg, xl)
- [ ] Update border-radius (rounded-xl, rounded-2xl)
- [ ] Update shadows (shadow-soft, shadow-soft-lg, shadow-soft-xl)
- [ ] Test all button variants across app

### **Phase 4: Card & Spacing (1h)**

- [ ] Update `card.tsx` padding (p-6 consistently)
- [ ] Update `globals.css` spacing scale
- [ ] Apply max-w-6xl thay max-w-7xl ở sections
- [ ] Tăng grid gap từ gap-6 → gap-8 hoặc gap-10

### **Phase 5: Homepage Translation (1h)**

- [ ] Hero section: full Vietnamese
- [ ] Features section: translate titles & descriptions
- [ ] Products section: "Featured Products" → "Sản phẩm nổi bật"
- [ ] Testimonials: names & reviews (giữ nguyên tiếng Anh nếu là real reviews)
- [ ] About section: translate
- [ ] Stats labels: "Happy Customers" → "Khách hàng hài lòng"

### **Phase 6: Header & Navigation (30min)**

- [ ] Verify all nav links đã tiếng Việt
- [ ] Dropdown "Chính sách" đầy đủ
- [ ] Cart icon tooltip tiếng Việt
- [ ] User menu (nếu có)

### **Phase 7: Chat Widget (30min)**

- [ ] Translate all text trong widget
- [ ] Add phone number CTA
- [ ] Test floating button position (fixed bottom-6 right-6)

### **Phase 8: Responsive & Testing (1-2h)**

- [ ] Test mobile: 375px, 768px
- [ ] Test tablet: 768px, 1024px
- [ ] Test desktop: 1280px+
- [ ] Check contrast ratios (WCAG AA)
- [ ] Verify all icons hiển thị đúng
- [ ] Check RTL (nếu cần)

---

## 📁 **FILES CẦN MODIFY**

1. ✅ `app/globals.css` - fonts, spacing
2. ✅ `tailwind.config.js` - font family, spacing scale
3. ✅ `components/ui/button.tsx` - size system, variants
4. ✅ `components/ui/card.tsx` - padding consistency
5. ✅ `components/Header.tsx` - Vietnamese labels
6. ✅ `components/Footer.tsx` - fix icon mapping, Vietnamese
7. ✅ `components/ChatWidget.tsx` - Vietnamese
8. ✅ `app/page.tsx` - full translation
9. ✅ `app/contact/page.tsx` - if exists
10. ✅ `app/policies/page.tsx` - already done ✅
11. ✅ `app/api/contact/route.ts` - fix field names

---

## 🎯 **IMMEDIATE ACTIONS (BẮT ĐẦU NGAY)**

### **Action 1: Fix Footer icon mapping**

```tsx
// Replace iconMap với:
const getIconByName = (name: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    mail: Mail,
    phone: Phone,
    map: MapPin,
    location: MapPin,
    clock: Clock,
    facebook: Facebook,
    instagram: Instagram,
    tiktok: TikTok,
    twitter: Twitter,
  };

  const key = name.toLowerCase();
  return iconMap[key] || MessageCircle;
};

// Usage:
{socialItems.map((item: any) => {
  const Icon = getIconByName(item.label);
  return (
    <a key={idx} href={item.value} ...>
      <Icon className="w-4 h-4" />
    </a>
  );
})}
```

### **Action 2: Fix Contact API field names**

```ts
// apps/web/app/api/contact/route.ts
const contactInfo = await prisma.contactInfo.findMany({
  where: { is_active: true },  // ← lowercase with underscore
  orderBy: { order_index: 'asc' },  // ← snake_case
});
```

### **Action 3: Start Translation**

Tạo file `translations.ts` để quản lý:

```ts
// constants/translations.ts
export const VI = {
  nav: {
    products: "Sản phẩm",
    explore: "Khám phá",
    blog: "Blog",
    policies: "Chính sách",
    // ...
  },
  hero: {
    badge: "Hệ Sinh Thái Thu Nhỏ Được Tạo Tình",
    title: "Mang Thiên Nhiên Vào Trong Nhà",
    subtitle: "Khám phá bộ sưu tập terrarium thủ công...",
    cta: "Mua Ngay",
    learnMore: "Tìm Hiểu Thêm",
  },
  // ...
};
```

---

## 📊 **BEFORE vs AFTER**

| Element | Before | After |
|---------|--------|-------|
| Font body | Plus Jakarta Sans | Inter |
| Font heading | Plus Jakarta Sans | Nunito Bold |
| Button height | h-10 (40px) inconsistent | h-10 default, h-12 lg, h-14 xl |
| Border radius | rounded-md (6px) | rounded-xl (12px) default |
| Card shadow | shadow-sm | shadow-soft |
| Section padding | py-20 (80px) | py-22 (88px) |
| Grid gap | gap-6 (24px) | gap-8 (32px) |
| Footer icons | Random/missing | Consistent with type mapping |
| Language | 50% English | 100% Vietnamese |

---

## ⏱️ **TIME ESTIMATE**

| Task | Time | Priority |
|------|------|----------|
| Fix Footer icons & API | 30min | 🔴 Critical |
| Vietnamese translation | 2-3h | 🔴 Critical |
| Typography updates | 30min | 🟡 Important |
| Button size system | 1h | 🟡 Important |
| Spacing consistency | 1h | 🟡 Important |
| Responsive testing | 1h | 🟢 Nice to have |
| **Total** | **6-7h** | |

---

## 🚀 **LỆNH THỰC THI**

Bạn có thể copy-paste từng section vào Claude để implement.

**Bắt đầu ngay với:**

1. **Fix Footer icons** (5 phút)
2. **Fix Contact API** (2 phút)
3. **Translate Homepage** (1h)
4. **Update button sizes** (30min)
5. **Test & verify** (30min)

---

**UI.md đã được cập nhật** với tất cả các bước trên. Bạn có thể đọc file đầy đủ để xem chi tiết.

Bạn muốn tôi **triển khai ngay** các fix này không? Tôi có thể:
1. Fix Footer ngay
2. Bắt đầu dịch homepage sang tiếng Việt
3. Cập nhật button system

Hãy cho tôi biết ưu tiên! 🚀
