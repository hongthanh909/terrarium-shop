"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BarChart3, Clock3, Eye, LogIn, Search, ShoppingCart, UserRound, Users, X } from "lucide-react";

type Overview = {
  range: number;
  summary: { onlineNow: number; visitorsToday: number; sessionsToday: number; pageViewsToday: number; registeredSessions: number; anonymousSessions: number };
  trend: Array<{ day: string; visitors: number; sessions: number; pageViews: number }>;
  funnel: Array<{ key: string; label: string; value: number }>;
  topPages: Array<{ path: string; views: number }>;
  topProducts: Array<{ id: string; name: string; slug: string; views: number }>;
  topSearches: Array<{ term: string; searches: number }>;
  recentActivity: Array<{ id: string; sessionId: string; eventType: string; path: string; searchTerm?: string; createdAt: string; visitorLabel: string; email?: string; registered: boolean; product?: { name: string; slug: string } }>;
};

type SessionDetail = {
  id: string; visitorLabel: string; registered: boolean; email?: string; phone?: string;
  startedAt: string; lastSeenAt: string; endedAt?: string; entryPath: string; exitPath?: string;
  referrer?: string; deviceType?: string; browser?: string; operatingSystem?: string; pageViews: number;
  events: Array<{ id: string; eventType: string; path: string; searchTerm?: string; durationMs?: number; createdAt: string; product?: { name: string; slug: string } }>;
};

const EVENT_LABELS: Record<string, string> = {
  PAGE_VIEW: "Xem trang", PRODUCT_VIEW: "Xem sản phẩm", SEARCH: "Tìm kiếm",
  ADD_TO_CART: "Thêm vào giỏ", REMOVE_FROM_CART: "Xóa khỏi giỏ",
  BEGIN_CHECKOUT: "Bắt đầu thanh toán", PURCHASE: "Tạo đơn", CHAT_OPEN: "Mở chat",
  CHAT_MESSAGE_SENT: "Gửi tin chat", LOGIN: "Đăng nhập", REGISTER: "Đăng ký", SESSION_END: "Rời trang",
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Không thể tải dữ liệu");
  return response.json();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function AnalyticsAdminPage() {
  const [range, setRange] = useState(7);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const overview = useQuery({
    queryKey: ["admin-analytics", range],
    queryFn: () => fetchJson<Overview>(`/api/admin/analytics/overview?range=${range}`),
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });
  const session = useQuery({
    queryKey: ["admin-analytics-session", selectedSession],
    queryFn: () => fetchJson<SessionDetail>(`/api/admin/analytics/sessions/${selectedSession}`),
    enabled: Boolean(selectedSession),
    refetchInterval: selectedSession ? 5_000 : false,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const source = new EventSource("/api/admin/analytics/stream");
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      if (selectedSession) void queryClient.invalidateQueries({ queryKey: ["admin-analytics-session", selectedSession] });
    };
    source.addEventListener("analytics", refresh);
    return () => {
      source.removeEventListener("analytics", refresh);
      source.close();
    };
  }, [queryClient, selectedSession]);

  const data = overview.data;
  const totalIdentity = (data?.summary.registeredSessions || 0) + (data?.summary.anonymousSessions || 0);
  const registeredPercent = totalIdentity ? Math.round(((data?.summary.registeredSessions || 0) / totalIdentity) * 100) : 0;
  const trendMax = Math.max(1, ...(data?.trend.map((item) => item.pageViews) || [1]));
  const funnelMax = Math.max(1, ...(data?.funnel.map((item) => item.value) || [1]));

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <header className="flex flex-col gap-4 border-b border-[#dce7d5] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#63804f]">Storefront analytics</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Phân tích truy cập</h2>
          <p className="mt-1 text-sm text-gray-500">Dữ liệu first-party đang cập nhật trực tiếp, đồng bộ dự phòng mỗi 5 giây.</p>
        </div>
        <div className="inline-flex w-fit border border-[#cedcc5] bg-white p-1" aria-label="Khoảng thời gian">
          {[7, 30, 90].map((days) => (
            <button key={days} type="button" onClick={() => setRange(days)} className={`min-h-9 px-4 text-sm font-semibold ${range === days ? "bg-[#425733] text-white" : "text-gray-600 hover:bg-[#f1f5ee]"}`}>
              {days} ngày
            </button>
          ))}
        </div>
      </header>

      {overview.isLoading && <div className="py-20 text-center text-sm text-gray-500">Đang tải dữ liệu truy cập...</div>}
      {overview.isError && <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">Không thể tải analytics. Vui lòng kiểm tra kết nối hoặc quyền admin.</div>}

      {data && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tổng quan hôm nay">
            {[
              { label: "Đang online", value: data.summary.onlineNow, icon: Activity, note: "Hoạt động trong 60 giây" },
              { label: "Khách hôm nay", value: data.summary.visitorsToday, icon: Users, note: "Trình duyệt duy nhất" },
              { label: "Phiên hôm nay", value: data.summary.sessionsToday, icon: Clock3, note: "Phiên truy cập" },
              { label: "Lượt xem hôm nay", value: data.summary.pageViewsToday, icon: Eye, note: "Tất cả trang cửa hàng" },
            ].map((item) => (
              <article key={item.label} className="border border-[#dce7d5] bg-white p-5 shadow-[0_3px_12px_rgba(46,72,35,0.05)]">
                <div className="flex items-start justify-between">
                  <div><p className="text-sm font-medium text-gray-500">{item.label}</p><p className="mt-2 text-3xl font-bold text-gray-900">{item.value.toLocaleString("vi-VN")}</p></div>
                  <item.icon className="h-5 w-5 text-[#63804f]" />
                </div>
                <p className="mt-3 text-xs text-gray-400">{item.note}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <div className="border-t border-[#dce7d5] pt-5">
              <div className="mb-5 flex items-center justify-between"><h3 className="font-bold text-gray-900">Xu hướng lượt xem</h3><BarChart3 className="h-5 w-5 text-[#63804f]" /></div>
              <div className="flex h-56 items-end gap-1 border-b border-l border-gray-200 px-2 pt-4 sm:gap-2">
                {data.trend.map((item) => (
                  <div key={item.day} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${item.pageViews} lượt xem, ${item.visitors} khách`}>
                    <span className="hidden text-xs font-semibold text-gray-600 group-hover:block sm:block">{item.pageViews}</span>
                    <div className="w-full max-w-8 bg-[#789b60] transition-all group-hover:bg-[#425733]" style={{ height: `${Math.max(4, (item.pageViews / trendMax) * 160)}px` }} />
                    <span className="max-w-full truncate text-[10px] text-gray-400">{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(item.day))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#dce7d5] pt-5">
              <h3 className="font-bold text-gray-900">Danh tính phiên truy cập</h3>
              <div className="mt-5 flex items-center gap-6">
                <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#425733 0 ${registeredPercent}%, #dce7d5 ${registeredPercent}% 100%)` }}>
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-[#fafbf8] text-center"><span className="text-xl font-bold text-gray-900">{registeredPercent}%</span></div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 bg-[#425733]" /> Đã đăng nhập: <strong>{data.summary.registeredSessions}</strong></p>
                  <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 bg-[#dce7d5]" /> Khách vãng lai: <strong>{data.summary.anonymousSessions}</strong></p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-[#dce7d5] pt-5">
            <h3 className="font-bold text-gray-900">Phễu mua hàng</h3>
            <div className="mt-5 grid gap-4 lg:grid-cols-4">
              {data.funnel.map((item, index) => (
                <div key={item.key} className="border-l-2 border-[#789b60] pl-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">Bước {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-700">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
                  <div className="mt-3 h-1.5 bg-gray-100"><div className="h-full bg-[#63804f]" style={{ width: `${(item.value / funnelMax) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 border-t border-[#dce7d5] pt-5 lg:grid-cols-3">
            <RankList title="Trang được xem nhiều" icon={<Eye className="h-4 w-4" />} rows={data.topPages.map((item) => ({ label: item.path, value: item.views }))} />
            <RankList title="Sản phẩm được quan tâm" icon={<ShoppingCart className="h-4 w-4" />} rows={data.topProducts.map((item) => ({ label: item.name, value: item.views }))} />
            <RankList title="Từ khóa tìm kiếm" icon={<Search className="h-4 w-4" />} rows={data.topSearches.map((item) => ({ label: item.term || "[đã ẩn]", value: item.searches }))} />
          </section>

          <section className="border-t border-[#dce7d5] pt-5">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-gray-900">Hoạt động gần đây</h3><span className="text-xs text-gray-400">Bấm một dòng để xem timeline</span></div>
            <div className="overflow-x-auto border border-[#dce7d5] bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#f1f5ee] text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Khách</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Trang</th><th className="px-4 py-3">Thời gian</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recentActivity.map((event) => (
                    <tr key={event.id} onClick={() => setSelectedSession(event.sessionId)} className="cursor-pointer hover:bg-[#f7faf5]">
                      <td className="px-4 py-3"><div className="flex items-center gap-2">{event.registered ? <LogIn className="h-4 w-4 text-[#63804f]" /> : <UserRound className="h-4 w-4 text-gray-400" />}<div><p className="font-semibold text-gray-800">{event.visitorLabel}</p><p className="text-xs text-gray-400">{event.email || "Ẩn danh"}</p></div></div></td>
                      <td className="px-4 py-3 font-medium text-gray-700">{EVENT_LABELS[event.eventType] || event.eventType}</td>
                      <td className="max-w-[300px] truncate px-4 py-3 text-gray-500">{event.searchTerm ? `Từ khóa: ${event.searchTerm}` : event.product?.name || event.path}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatTime(event.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {selectedSession && (
        <div className="fixed inset-0 z-[10030] flex justify-end bg-black/30" onClick={() => setSelectedSession(null)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <div><p className="text-xs font-semibold uppercase text-[#63804f]">Timeline phiên</p><h3 className="font-bold text-gray-900">{session.data?.visitorLabel || "Đang tải..."}</h3></div>
              <button type="button" onClick={() => setSelectedSession(null)} className="grid h-10 w-10 place-items-center text-gray-500 hover:bg-gray-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
            </div>
            {session.isLoading && <p className="p-6 text-sm text-gray-500">Đang tải timeline...</p>}
            {session.data && <SessionTimeline session={session.data} />}
          </aside>
        </div>
      )}
    </div>
  );
}

function RankList({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: Array<{ label: string; value: number }> }) {
  return <div><div className="mb-3 flex items-center gap-2 font-bold text-gray-900">{icon}{title}</div><ol className="divide-y divide-gray-100 border border-[#dce7d5] bg-white">{rows.length ? rows.map((row, index) => <li key={`${row.label}-${index}`} className="flex items-center gap-3 px-4 py-3"><span className="w-5 text-xs font-bold text-gray-300">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm text-gray-700">{row.label}</span><strong className="text-sm text-[#425733]">{row.value}</strong></li>) : <li className="px-4 py-8 text-center text-sm text-gray-400">Chưa có dữ liệu</li>}</ol></div>;
}

function SessionTimeline({ session }: { session: SessionDetail }) {
  return <div className="p-5"><div className="grid grid-cols-2 gap-3 border-b border-gray-200 pb-5 text-sm"><Info label="Trạng thái" value={session.registered ? "Đã đăng nhập" : "Khách vãng lai"} /><Info label="Thiết bị" value={`${session.deviceType || "-"} · ${session.browser || "-"}`} /><Info label="Bắt đầu" value={formatTime(session.startedAt)} /><Info label="Xem trang" value={String(session.pageViews)} /><Info label="Email" value={session.email || "-"} /><Info label="Điện thoại" value={session.phone || "-"} /></div><div className="mt-6 space-y-0">{session.events.map((event) => <div key={event.id} className="relative border-l border-[#b9ccb0] pb-6 pl-6 last:pb-0"><span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#63804f]" /><p className="text-xs text-gray-400">{formatTime(event.createdAt)}</p><p className="mt-1 font-semibold text-gray-800">{EVENT_LABELS[event.eventType] || event.eventType}</p><p className="mt-1 break-words text-sm text-gray-500">{event.product?.name || event.searchTerm || event.path}</p>{event.durationMs ? <p className="mt-1 text-xs text-gray-400">Thời lượng: {Math.round(event.durationMs / 1000)} giây</p> : null}</div>)}</div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-gray-400">{label}</p><p className="mt-1 font-semibold text-gray-700">{value}</p></div>;
}
