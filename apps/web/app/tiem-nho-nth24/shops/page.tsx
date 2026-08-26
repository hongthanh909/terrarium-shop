import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ApplicationActions, ShopRiskActions } from "./AdminShopActions";

export default async function AdminShopsPage() {
  const [applications, shops] = await Promise.all([
    prisma.shopApplication.findMany({
      where: { status: "PENDING" },
      include: { customer: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shop.findMany({
      include: {
        owner: { select: { email: true, name: true } },
        _count: { select: { products: true, inquiries: true, policyViolations: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý shop</h1>
          <p className="mt-1 text-sm text-gray-500">Admin duyệt shop, kiểm tra policy, rating và giá sản phẩm thủ công.</p>
        </div>
        <Link href="/tiem-nho-nth24/marketplace-products" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
          Duyệt sản phẩm marketplace
        </Link>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Đơn đăng ký chờ duyệt</h2>
        <div className="mt-4 divide-y divide-gray-100">
          {applications.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">Không có đơn mới.</p>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-semibold text-gray-900">{app.shopName}</p>
                  <p className="text-sm text-gray-500">{app.ownerName} · {app.phone} · {app.customer.email}</p>
                  <p className="mt-1 text-sm text-gray-600">{app.description}</p>
                </div>
                <ApplicationActions id={app.id} />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Danh sách shop</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-400">
              <tr>
                <th className="px-3 py-2">Shop</th>
                <th className="px-3 py-2">Rating</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Sản phẩm</th>
                <th className="px-3 py-2">Vi phạm</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shops.map((shop) => (
                <tr key={shop.id}>
                  <td className="px-3 py-3">
                    <Link href={`/tiem-nho-nth24/shops/${shop.id}`} className="font-semibold text-gray-900 hover:text-primary">
                      {shop.name}
                    </Link>
                    <p className="text-xs text-gray-500">{shop.owner.email}</p>
                  </td>
                  <td className={`px-3 py-3 font-semibold ${shop.ratingPercent < 60 ? "text-red-600" : "text-emerald-700"}`}>{shop.ratingPercent}%</td>
                  <td className="px-3 py-3">{shop.status}</td>
                  <td className="px-3 py-3">{shop._count.products}</td>
                  <td className="px-3 py-3">{shop._count.policyViolations}</td>
                  <td className="px-3 py-3"><ShopRiskActions id={shop.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
