import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CustomerMessagesClient } from "@/components/chat/CustomerMessagesClient";
import { ADMIN_LOGIN_PATH, ADMIN_SECRET_PATH } from "@/lib/admin-path";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CustomerMessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/messages");
  }

  if ((session.user as any).role === "ADMIN") {
    redirect((session.user as any).adminSession === true ? `${ADMIN_SECRET_PATH}/messages` : ADMIN_LOGIN_PATH);
  }

  return <CustomerMessagesClient />;
}
