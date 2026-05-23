import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Verify that the request comes from an authenticated ADMIN user.
 * Returns the token payload if valid, or null if unauthorized.
 */
export async function verifyAdminRequest(
  request: NextRequest
): Promise<TokenPayload | null> {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || token.role !== "ADMIN") {
      return null;
    }
    
    return {
      id: token.id as string,
      email: token.email as string,
      role: token.role as string,
    };
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
