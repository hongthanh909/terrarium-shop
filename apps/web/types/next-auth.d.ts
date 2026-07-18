import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "CUSTOMER" | "SELLER" | "ADMIN";
      authProvider?: "customer-login" | "admin-login";
      adminSession?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: "CUSTOMER" | "SELLER" | "ADMIN";
    authProvider?: "customer-login" | "admin-login";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "CUSTOMER" | "SELLER" | "ADMIN";
    authProvider?: "customer-login" | "admin-login";
    adminSession?: boolean;
  }
}
