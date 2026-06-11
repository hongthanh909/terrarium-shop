# DESIGN.md — Tiệm Rêu Décor Design System

> Design Read: "E-commerce cây cảnh terrarium cho người Việt, premium consumer vibes, Forest palette, leaning toward Tailwind + shadcn/ui + Motion."

## Taste Skill Dial Configuration

```
DESIGN_VARIANCE: 7    — Premium consumer, asymmetric layouts welcome but not wild
MOTION_INTENSITY: 6   — Scroll reveals, spring hover, carousel. No GSAP hijacks.
VISUAL_DENSITY: 4     — Lifestyle e-commerce, airy with product focus
```

---

## Color Tokens

### Primary Palette — Forest Green

| Token | Value | Usage |
|---|---|---|
| `--brand-primary` | `#425733` | CTA buttons, active states, headings |
| `--brand-primary-dark` | `#2d3d23` | Hover states, footer bg |
| `--brand-primary-deeper` | `#1a2e12` | Text, dark surfaces |
| `--brand-secondary` | `#e3ebdd` | Badges, soft backgrounds, tags |
| `--brand-accent-green` | `#8fba6f` | Cart badge, success states |
| `--brand-accent-soft` | `#a8c098` | Review borders, decorative |

### Warm Accent (conversion elements)

| Token | Value | Usage |
|---|---|---|
| `--accent-warm` | `hsl(25, 40%, 59%)` | CTA emphasis, sale elements |

### Neutrals

| Token | Value | Usage |
|---|---|---|
| `--surface-page` | `#fafbf8` | Page background |
| `--surface-card` | `#ffffff` | Product cards, review cards |
| `--surface-muted` | `#f2f8f2` | Soft backgrounds |
| `--border-default` | `#e3ebdd` | Card borders |
| `--border-hover` | `#b8d8b8` | Hover card borders |
| `--text-primary` | `hsl(220, 14%, 25%)` | Body text |
| `--text-secondary` | `hsl(220, 14%, 45%)` | Muted text |

### Banned Colors (per taste skill Section 4.2)

- No AI-purple gradients
- No random neon / blue glows
- No warm beige/cream as page bg (#f5f1ea family)
- Palette locked: Forest green family throughout

---

## Typography

### Font Stack

- **Primary**: `Inter` (justified: already in project, neutral/clean fit for e-commerce)
- **Fallback**: `system-ui, -apple-system, sans-serif`

### Scale

| Element | Class | Notes |
|---|---|---|
| Hero H1 | `text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold` | Max 2 lines desktop |
| Section H2 | `text-3xl md:text-4xl font-bold` | Gradient text applied |
| Card title | `text-base font-semibold` | Single line, truncate |
| Body | `text-base text-gray-600 leading-relaxed` | Max-width 65ch |
| Small/Label | `text-sm font-medium` | Uppercase tracking for badges |

### Heading Gradient Pattern

```css
background: linear-gradient(135deg, #1a2e12, #425733);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

Used on ALL section headings for visual weight. Consistent across homepage, stats, reviews, about.

---

## Spacing & Layout

### Section Rhythm

| Section type | Padding | Container |
|---|---|---|
| Primary sections | `py-24 px-6` | `max-w-7xl mx-auto` |
| Secondary sections | `py-14 px-6` | `max-w-7xl mx-auto` |
| CTA sections | `py-16 px-6` | `max-w-3xl mx-auto text-center` |

### Grid Patterns

| Pattern | Columns | Gap |
|---|---|---|
| Product grid | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | `gap-6` |
| Blog grid | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | `gap-8` |
| Bento (explore) | `grid-cols-2 md:grid-cols-4` | `gap-4` |

---

## Component Patterns

### Product Card

- Background: `bg-white` (not `bg-[#f2f8f2]`)
- Border: `border-[#e3ebdd]` → hover: `border-[#b8d8b8]`
- Shadow: `shadow-sm` → hover: `shadow-lg`
- CTA button: gradient `from-[#3a5229] to-[#4a6a35]` with shadow
- Ratings: show "Chưa có đánh giá" when no reviews (no fake 5.0)
- Wishlist: visible on mobile (`opacity-40`), hidden desktop (`sm:opacity-0 sm:group-hover:opacity-100`)

### Buttons

```
Primary:   bg-gradient / bg-primary, text-white, rounded-full, active:scale-[0.97]
Outline:   border-2, border-primary/30, rounded-full
Ghost:     hover:bg-primary/10
```

### Sale Badge

```
bg-gradient-to-r from-red-500 to-rose-400 text-white text-xs font-bold
```

### Cards in General

- Corner radius: `rounded-2xl` (consistent shape lock)
- Always `bg-white` not tinted green
- Shadow tinted to green: `shadow-[0_4px_20px_rgba(66,87,51,0.06)]`

---

## Motion Patterns

### Allowed (MOTION_INTENSITY: 6)

- ScrollReveal: `whileInView` with `y: 24` to `y: 0`, stagger `0.06s`
- Cart badge: `type: "spring", stiffness: 500, damping: 15`
- Hover lift: `whileHover={{ y: -6 }}` on cards
- Button: `active:scale-[0.97]`
- Social icons: `hover:scale-110 hover:-translate-y-0.5`

### Banned

- No `window.addEventListener('scroll')`
- No `useState` for continuous scroll/mouse values
- No GSAP scroll-hijack (overkill for this site)
- No infinite loop animations on static content

---

## Mobile Rules

- Hero: carousel FIRST (`order-1`), text SECOND (`order-2`) on mobile
- Category pills: horizontal scroll with `scrollbar-none`
- Cart items: `w-20 h-20` on mobile, `sm:w-16 sm:h-16` desktop
- Feature cards: `min-height: auto; padding: 1rem` on mobile
- Mobile menu: `backdrop-blur-md`
- `min-h-[100dvh]` preferred over `h-screen`

---

## Footer Rules

- Social icons at TOP section only (no duplicate at bottom)
- Links: animated underline (`after:` pseudo-element)
- Bottom: copyright + tagline only

---

## Selection & Global Polish

```css
html { scroll-behavior: smooth; }
::selection { background: rgba(66, 87, 51, 0.15); color: #1a2e12; }
```

---

## Taste Skill Pre-Flight Checklist (apply on every UI change)

- [ ] One accent color (Forest Green) used consistently across all sections
- [ ] Shape consistency: `rounded-2xl` cards, `rounded-full` buttons
- [ ] Hero fits viewport (2 lines heading max, CTA visible)
- [ ] No duplicate CTA intent on same page
- [ ] Eyebrow count is less than or equal to ceil(sectionCount / 3)
- [ ] No em-dashes in copy
- [ ] Button text readable against background (WCAG AA)
- [ ] Mobile collapse explicit for every multi-column layout
- [ ] Real images used (no div-based fakes)
- [ ] Copy audit: no AI-hallucinated phrases
