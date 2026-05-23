# AUTHENTICATION IMPLEMENTATION PLAN

> **Mục tiêu**: Implement JWT HTTP-only cookie-based authentication với bcrypt password hashing
> **Hình thức auth**: Cookie-based JWT (không dùng localStorage)
> **Ưu tiên**: 🔴 Critical

---

## 📋 TỔNG QUAN CÁC BƯỚC

1. **Install dependencies** (bcryptjs, jsonwebtoken, zod)
2. **Hash passwords với bcrypt**
3. **Tạo auth helper lib** (signToken, verifyToken)
4. **Cập nhật Register API** (hash password + set cookie)
5. **Cập nhật Login API** (verify password + set cookie)
6. **Tạo Auth Middleware** (bảo vệ routes)
7. **Thêm Zod validation** cho auth APIs
8. **Tạo logout endpoint**
9. **Update environment variables**
10. **Test đầy đủ**

---

## 🔧 BƯỚC 1: INSTALL DEPENDENCIES

```bash
npm install bcryptjs jsonwebtoken zod
npm install -D @types/bcryptjs @types/jsonwebtoken
```

---

## 🔐 BƯỚC 2: HASH PASSWORDS VỚI BCRYPT

### File cần sửa: `apps/web/app/api/auth/register/route.ts`

**Trước (NGUY HIỂM - plain text):**
```typescript
const result = await supabase.from('Customer').insert({
  email,
  passwordHash: password,  // ❌ LƯU Plain Text!
  fullName,
  phone
});
```

**Sau (AN TOÀN - bcrypt hash):**
```typescript
import bcrypt from 'bcryptjs';

const saltRounds = 10;
const passwordHash = await bcrypt.hash(password, saltRounds);

const result = await supabase.from('Customer').insert({
  email,
  passwordHash,  // ✅ Đã hash
  fullName,
  phone
});
```

---

## 🍪 BƯỚC 3: TẠO AUTH HELPER LIB

**Tạo file:** `apps/web/lib/auth.ts`

```typescript
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

// Sign JWT token
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',  // Token hạn 7 ngày
  });
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
}

// Set HTTP-only cookie
export function setAuthCookie(token: string) {
  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,  // 7 days
    path: '/',
  });
}

// Clear auth cookie (logout)
export function clearAuthCookie() {
  cookies().set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
}

// Get current user from cookie
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  return verifyToken(token);
}
```

---

## 📝 BƯỚC 4: CẬP NHẬT REGISTER API

**File:** `apps/web/app/api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { signToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

// Zod validation schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password phải có ít nhất 6 ký tự'),
  fullName: z.string().min(1, 'Họ tên là bắt buộc'),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Validate input
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // 2. Check if user exists
    const { data: existing } = await supabase
      .from('Customer')
      .select('id')
      .eq('email', validated.email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email đã tồn tại' },
        { status: 400 }
      );
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // 4. Create user
    const { data: customer, error } = await supabase
      .from('Customer')
      .insert({
        email: validated.email,
        passwordHash,
        fullName: validated.fullName,
        phone: validated.phone || null,
        role: 'CUSTOMER',
      })
      .select('id, email, fullName, role')
      .single();

    if (error) throw error;

    // 5. Generate JWT token
    const token = signToken({
      userId: customer.id,
      email: customer.email,
      role: customer.role,
    });

    // 6. Set HTTP-only cookie
    setAuthCookie(token);

    // 7. Return success (không trả token trong body vì đã có cookie)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: customer.id,
          email: customer.email,
          fullName: customer.fullName,
          role: customer.role,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Đăng ký thất bại' },
      { status: 500 }
    );
  }
}
```

---

## 🔑 BƯỚC 5: CẬP NHẬT LOGIN API

**File:** `apps/web/app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { signToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

// Zod validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Validate input
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // 2. Get user by email
    const { data: customer, error } = await supabase
      .from('Customer')
      .select('*')
      .eq('email', validated.email)
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // 3. Verify password (so sánh với hash đã lưu)
    const isPasswordValid = await bcrypt.compare(
      validated.password,
      customer.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // 4. Generate JWT token
    const token = signToken({
      userId: customer.id,
      email: customer.email,
      role: customer.role,
    });

    // 5. Set HTTP-only cookie
    setAuthCookie(token);

    // 6. Return user data (không trả passwordHash)
    const { passwordHash, ...user } = customer;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Đăng nhập thất bại' },
      { status: 500 }
    );
  }
}
```

---

## 🛡️ BƯỚC 6: TẠO AUTH MIDDLEWARE

**Tạo file:** `apps/web/middleware.ts` (hoặc `apps/web/middleware.ts` nếu chưa có)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Public paths - không cần authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/products',
  '/products/[slug]',
  '/blog',
  '/blog/[slug]',
  '/contact',
  '/consult',
  '/policies',
  '/api/auth',
  '/api/products',
  '/api/blog',
];

// Admin paths - chỉ admin mới truy cập được
const ADMIN_PATHS = [
  '/admin',
  '/admin/products',
  '/admin/products/create',
  '/admin/products/[id]/edit',
  '/admin/categories',
  '/admin/orders',
  '/admin/reviews',
  '/admin/blog',
  '/admin/blog/create',
  '/admin/blog/[id]/edit',
  '/api/admin',
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('auth_token')?.value;

  // Check if path is public
  const isPublic = PUBLIC_PATHS.some(pattern => {
    if (pattern.includes('[')) {
      // Handle dynamic routes - check prefix
      const prefix = pattern.split('[')[0];
      return pathname.startsWith(prefix);
    }
    return pathname === pattern;
  });

  // If public, allow
  if (isPublic) {
    return NextResponse.next();
  }

  // If not public, require authentication
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  const payload = verifyToken(token);
  if (!payload) {
    // Invalid token - clear cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  // Check admin routes
  const isAdminPath = ADMIN_PATHS.some(pattern => {
    if (pattern.includes('[')) {
      const prefix = pattern.split('[')[0];
      return pathname.startsWith(prefix);
    }
    return pathname === pattern || pathname.startsWith(pattern);
  });

  if (isAdminPath && payload.role !== 'ADMIN') {
    // Not admin trying to access admin area
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Attach user info to request for use in pages/APIs
  // Note: In Next.js 14 App Router, we can't directly modify request
  // But we can set headers if needed
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-role', payload.role);

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes (handled separately if needed)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## 🚪 BƯỚC 7: TẠO LOGOUT ENDPOINT

**Tạo file:** `apps/web/app/api/auth/logout/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  // Clear the HTTP-only cookie
  clearAuthCookie();

  return NextResponse.json(
    { success: true, message: 'Đã đăng xuất' },
    { status: 200 }
  );
}

// Also handle GET for convenience
export async function GET() {
  clearAuthCookie();
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
```

---

## ✅ BƯỚC 8: ZOD VALIDATION CHO CÁC API

**Auth APIs đã có validation ở trên.**

**Ví dụ cho API khác (products, orders):**

```typescript
import { z } from 'zod';

// Example: Product validation
const productSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  price: z.number().positive('Giá phải lớn hơn 0'),
  categoryId: z.string().uuid('Category ID không hợp lệ'),
  description: z.string().optional(),
  variants: z.array(z.object({
    size: z.string(),
    type: z.string(),
    decor: z.string().optional(),
    priceAdjustment: z.number().default(0),
    stock: z.number().int().nonnegative(),
    sku: z.string(),
  })).min(1, 'Cần ít nhất 1 variant'),
});
```

---

## 🔧 BƯỚC 9: UPDATE ENVIRONMENT VARIABLES

**Thêm vào `.env` file:**

```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this-in-production
```

**Tạo một secret mạnh:**
```bash
# Dùng Node.js để generate
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 BƯỚC 10: TESTING CHECKLIST

### Register Test
- [ ] Đăng ký với email mới → tạo user mới với password đã hash
- [ ] Kiểm tra trong database: `passwordHash` phải là bcrypt hash (bắt đầu bằng `$2a$` hoặc `$2b$`)
- [ ] Cookie `auth_token` được set với flag `HttpOnly`
- [ ] Đăng ký lại email đã tồn tại → trả về lỗi 400

### Login Test
- [ ] Login với email/password đúng → set cookie, trả về user
- [ ] Login với password sai → 401
- [ ] Login với email không tồn tại → 401
- [ ] Kiểm tra cookie `auth_token` là HTTP-only (không truy cập được qua JavaScript)

### Cookie Test
- [ ] Cookie có flag `Secure` trong production
- [ ] Cookie có `SameSite=Lax`
- [ ] Cookie `maxAge` là 7 ngày

### Middleware Test
- [ ] Truy cập `/admin/products` khi chưa login → redirect `/login`
- [ ] Truy cập `/admin/products` khi login customer → redirect `/`
- [ ] Truy cập `/admin/products` khi login admin → cho phép
- [ ] Truy cập trang public (`/products`) không cần login

### Logout Test
- [ ] POST `/api/auth/logout` → cookie bị xóa, trả về success
- [ ] Sau logout, truy cập `/admin` → redirect `/login`

### Password Hash Test
- [ ] Dùng bcrypt.compare để verify password
- [ ] Hash mới mỗi lần register (không cache)
- [ ] Cost factor = 10 (balance giữa security & performance)

---

## 📊 KIẾN TRÚC FLOW

```
Register:
  1. Client gửi {email, password, fullName, phone}
  2. Validate với Zod
  3. Check email exists
  4. bcrypt.hash(password, 10)
  5. Insert vào Customer table
  6. JWT.sign(payload, JWT_SECRET, {expiresIn: '7d'})
  7. cookies.set('auth_token', token, {httpOnly: true, ...})
  8. Return user (không có passwordHash)

Login:
  1. Client gửi {email, password}
  2. Validate với Zod
  3. SELECT * FROM Customer WHERE email = ?
  4. bcrypt.compare(password, storedHash)
  5. Nếu match: JWT.sign + set cookie
  6. Return user
  7. Nếu không match: 401

Middleware:
  1. Check request.pathname
  2. Nếu public path → NextResponse.next()
  3. Nếu private:
     - Đọc cookie auth_token
     - verifyToken(token)
     - Nếu admin path và role !== ADMIN → redirect /
     - Nếu không có token → redirect /login

Logout:
  1. cookies.set('auth_token', '', {expires: new Date(0)})
  2. Redirect về /
```

---

## ⚠️ SECURITY NOTES

1. **Never** store plain text passwords
2. **Always** use bcrypt with salt rounds 10
3. **Never** send JWT token in response body (chỉ dùng cookie)
4. **HTTP-only** cookie ngăn XSS attacks
5. **SameSite=Lax** ngăn CSRF attacks
6. **Secure flag** trong production (HTTPS only)
7. **JWT expiration** 7 ngày (có thể điều chỉnh)
8. **Never** return passwordHash trong API responses
9. **Always validate** với Zod trước khi xử lý
10. **Use environment variable** cho JWT_SECRET (không hardcode)

---

## 🔄 MIGRATION CHO EXISTING USERS

**Nếu đã có users với plain-text password:**

```typescript
// Tạo script migration: apps/scripts/migrate-passwords.ts
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

async function migratePasswords() {
  const { data: users } = await supabase
    .from('Customer')
    .select('id, passwordHash')
    .not('passwordHash', 'is', null);

  for (const user of users) {
    // Kiểm tra nếu password chưa hash (plain text)
    if (!user.passwordHash.startsWith('$2')) {
      const hashed = await bcrypt.hash(user.passwordHash, 10);
      
      await supabase
        .from('Customer')
        .update({ passwordHash: hashed })
        .eq('id', user.id);
      
      console.log(`Migrated user ${user.id}`);
    }
  }
}

migratePasswords();
```

---

## 🎯 NEXT STEPS

Sau khi hoàn thành Auth:

1. **Protect admin routes** bằng middleware ✅
2. **Update login/logout UI** để dùng cookie auth
3. **Remove localStorage references** trong code hiện tại
4. **Add protected route helpers** trong components
5. **Implement "Remember Me"** (optional - tăng maxAge)
6. **Add password reset flow** (future)

---

## 📁 FILES TO MODIFY/CREATE

### Create:
- `apps/web/lib/auth.ts` ✨ NEW
- `apps/web/middleware.ts` ✨ NEW
- `apps/web/app/api/auth/logout/route.ts` ✨ NEW

### Modify:
- `apps/web/app/api/auth/register/route.ts` (hash password, set cookie)
- `apps/web/app/api/auth/login/route.ts` (verify password, set cookie)
- `.env` (thêm JWT_SECRET)
- `apps/web/app/login/page.tsx` (loại bỏ localStorage)
- `apps/web/app/globals.css` (optional: thêm loading states)

---

**Khi đã hoàn thành tất cả bước trên, đánh dấu trong CHECKLIST.md:**
- [x] Hash password với bcrypt
- [x] JWT Cookie-based Auth
- [x] Auth Middleware
- [x] Zod validation cho API auth
