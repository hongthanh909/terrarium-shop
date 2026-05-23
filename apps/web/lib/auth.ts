import { SignJWT, verifyJWT } from 'jose';
import { cookies } from 'next/headers';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Sign JWT token using jose
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// Verify JWT token using jose
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await verifyJWT(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as TokenPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Set HTTP-only cookie
export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,  // 7 days
    path: '/',
  });
}

// Clear auth cookie (logout)
export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.set('auth_token', '', {
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
