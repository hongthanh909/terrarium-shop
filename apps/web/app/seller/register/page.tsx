import RegisterShopForm from "./RegisterShopForm";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";

export default async function SellerRegisterPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?callbackUrl=/seller/register");

  const [shop, latestApplication] = await Promise.all([
    prisma.shop.findFirst({ where: { ownerId: customer.id }, orderBy: { createdAt: "desc" } }),
    prisma.shopApplication.findFirst({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (shop && ["ACTIVE", "UNDER_REVIEW", "PENDING", "SUSPENDED"].includes(shop.status)) {
    redirect("/seller");
  }

  if (latestApplication?.status === "PENDING") {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#dfe8d7] bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6f8d5e]">Đơn mở shop</p>
        <h1 className="mt-2 text-3xl font-bold text-[#203018]">Đang chờ admin duyệt</h1>
        <p className="mt-3 text-sm leading-6 text-[#526248]">
          Shop <strong>{latestApplication.shopName}</strong> đã được gửi đăng ký. Sau khi admin duyệt, menu tài khoản sẽ hiện “Shop của tôi”.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6f8d5e]">Mở shop cá nhân</p>
        <h1 className="mt-2 text-3xl font-bold text-[#203018]">Đăng ký shop terrarium</h1>
        <p className="mt-3 text-sm leading-6 text-[#526248]">
          Admin sẽ duyệt hồ sơ trước khi shop được đăng sản phẩm. Giao dịch, giao hàng và bảo hành do shop tự thỏa thuận với người mua.
        </p>
      </div>
      <RegisterShopForm />
    </div>
  );
}
