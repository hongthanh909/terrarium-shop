import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  authProvider?: string;
}

function hasAdminSession(token: any): boolean {
  return token?.role === "ADMIN" && token?.authProvider === "admin-login" && token?.adminSession === true;
}

/**
 * Verify that the request comes from an authenticated ADMIN user.
 * Returns the token payload if valid, or null if unauthorized.
 *
 * Strategy:
 *  1. Try getToken() with both cookie variants (HTTP local dev + HTTPS prod)
 *  2. Fallback to getServerSession() as last resort
 */
export async function verifyAdminRequest(
  request: NextRequest
): Promise<TokenPayload | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;

    // Try 1: auto-detect (NextAuth picks based on NEXTAUTH_URL)
    let token = await getToken({ req: request as any, secret });

    // Try 2: explicit HTTPS secure cookie (production)
    if (!token) {
      token = await getToken({
        req: request as any,
        secret,
        cookieName: "__Secure-next-auth.session-token",
      });
    }

    // Try 3: explicit HTTP cookie (local dev)
    if (!token) {
      token = await getToken({
        req: request as any,
        secret,
        cookieName: "next-auth.session-token",
      });
    }

    if (token && hasAdminSession(token)) {
      return {
        id: token.id as string,
        email: token.email as string,
        role: token.role as string,
        authProvider: token.authProvider as string,
      };
    }

    // Try 4: Fallback to server session (works in API routes)
    const session = await getServerSession(authOptions);
    if (session && (session.user as any)?.role === "ADMIN" && (session.user as any)?.authProvider === "admin-login" && (session.user as any)?.adminSession === true) {
      return {
        id: (session.user as any).id as string,
        email: session.user?.email as string,
        role: (session.user as any).role as string,
        authProvider: (session.user as any).authProvider as string,
      };
    }

    return null;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

/**
 * Standard unauthorized response for API routes
 */
export function unauthorizedResponse() {
  return Response.json(
    { error: "Unauthorized. Admin access required." },
    { status: 401 }
  );
}
