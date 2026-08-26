"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, RefreshCw, Save, X } from "lucide-react";
import { showToast } from "@/components/ui/custom-toast";

type Config = { enabled: boolean; title: string; description: string; ctaLabel: string; groupUrl: string; campaignId: string | null; delaySeconds: number; repeatDays: number };
type Campaign = { id: string; code: string; status: string; expiresAt: string };
type Claim = {
  id: string; facebookName: string; facebookProfileUrl: string | null; status: string; reviewNote: string | null; createdAt: string;
  customer: { name: string | null; email: string; phone: string | null }; campaign: { code: string };
};

const statusLabels: Record<string, string> = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối", REDEEMED: "Đã dùng" };

export default function FacebookPromoAdminPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [configResponse, claimsResponse] = await Promise.all([
        fetch("/api/admin/community-reward", { cache: "no-store" }),
        fetch(`/api/admin/community-reward/claims?status=${filter}`, { cache: "no-store" }),
      ]);
      if (!configResponse.ok || !claimsResponse.ok) throw new Error("Không thể tải dữ liệu");
      const configData = await configResponse.json();
      setConfig(configData.config);
      setCampaigns(configData.campaigns);
      setClaims(await claimsResponse.json());
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Không thể tải dữ liệu");
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/community-reward", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể lưu cấu hình");
      showToast.success("Đã lưu cấu hình ưu đãi Facebook");
    } catch (error) { showToast.error(error instanceof Error ? error.message : "Không thể lưu"); }
    finally { setSaving(false); }
  };

  const review = async (id: string, status: "APPROVED" | "REJECTED") => {
    const reviewNote = status === "REJECTED" ? window.prompt("Lý do từ chối (không bắt buộc):") ?? "" : "";
    setReviewing(id);
    try {
      const response = await fetch(`/api/admin/community-reward/claims/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reviewNote }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể cập nhật");
      setClaims((current) => filter === "ALL" ? current.map((claim) => claim.id === id ? { ...claim, status } : claim) : current.filter((claim) => claim.id !== id));
      showToast.success(status === "APPROVED" ? "Đã duyệt voucher" : "Đã từ chối yêu cầu");
    } catch (error) { showToast.error(error instanceof Error ? error.message : "Không thể cập nhật"); }
    finally { setReviewing(null); }
  };

  const pendingCount = useMemo(() => claims.filter((claim) => claim.status === "PENDING").length, [claims]);
  if (loading && !config) return <div className="py-16 text-center text-sm text-gray-500">Đang tải...</div>;
  if (!config) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="border-b border-[#dce6d6] pb-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-bold text-gray-900">Popup tham gia nhóm Facebook</h2><p className="mt-1 text-sm text-gray-500">Điều chỉnh nội dung và voucher hiển thị trên cửa hàng.</p></div>
          <button onClick={saveConfig} disabled={saving} className="flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Đang lưu..." : "Lưu cấu hình"}</button>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700"><input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} className="h-5 w-5 accent-primary" />Bật popup trên cửa hàng</label>
          <label className="text-sm font-medium text-gray-700">Voucher 100.000đ<select value={config.campaignId ?? ""} onChange={(e) => setConfig({ ...config, campaignId: e.target.value || null })} className="mt-2 min-h-11 w-full rounded-md border border-gray-300 bg-white px-3"><option value="">Chọn voucher</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.code} - {campaign.status}</option>)}</select></label>
          <label className="text-sm font-medium text-gray-700">Tiêu đề<input value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} maxLength={100} className="mt-2 min-h-11 w-full rounded-md border border-gray-300 bg-white px-3" /></label>
          <label className="text-sm font-medium text-gray-700">Nút kêu gọi<input value={config.ctaLabel} onChange={(e) => setConfig({ ...config, ctaLabel: e.target.value })} maxLength={50} className="mt-2 min-h-11 w-full rounded-md border border-gray-300 bg-white px-3" /></label>
          <label className="text-sm font-medium text-gray-700 md:col-span-2">Nội dung<textarea value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })} maxLength={300} rows={3} className="mt-2 w-full rounded-md border border-gray-300 bg-white p-3" /></label>
          <label className="text-sm font-medium text-gray-700 md:col-span-2">Đường dẫn nhóm Facebook<input value={config.groupUrl} onChange={(e) => setConfig({ ...config, groupUrl: e.target.value })} className="mt-2 min-h-11 w-full rounded-md border border-gray-300 bg-white px-3" /></label>
          <label className="text-sm font-medium text-gray-700">Hiện sau (giây)<input type="number" min={0} max={30} value={config.delaySeconds} onChange={(e) => setConfig({ ...config, delaySeconds: Number(e.target.value) })} className="mt-2 min-h-11 w-full rounded-md border border-gray-300 bg-white px-3" /></label>
          <label className="text-sm font-medium text-gray-700">Hiện lại sau (ngày)<input type="number" min={1} max={90} value={config.repeatDays} onChange={(e) => setConfig({ ...config, repeatDays: Number(e.target.value) })} className="mt-2 min-h-11 w-full rounded-md border border-gray-300 bg-white px-3" /></label>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-bold text-gray-900">Yêu cầu duyệt voucher</h2><p className="mt-1 text-sm text-gray-500">Kiểm tra thành viên trong nhóm trước khi duyệt.</p></div>
          <button onClick={load} className="grid h-11 w-11 place-items-center rounded-md border border-gray-300 bg-white text-gray-600" title="Tải lại"><RefreshCw className="h-4 w-4" /></button>
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{["PENDING", "APPROVED", "REJECTED", "REDEEMED", "ALL"].map((item) => <button key={item} onClick={() => setFilter(item)} className={`min-h-9 shrink-0 rounded-md border px-3 text-xs font-semibold ${filter === item ? "border-[#557a45] bg-[#edf4e9] text-primary" : "border-gray-200 bg-white text-gray-600"}`}>{item === "ALL" ? "Tất cả" : statusLabels[item]}{item === "PENDING" && filter === "PENDING" && pendingCount ? ` (${pendingCount})` : ""}</button>)}</div>
        <div className="overflow-x-auto border-y border-gray-200 bg-white">
          <table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-[#f5f7f3] text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Facebook</th><th className="px-4 py-3">Gửi lúc</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{claims.map((claim) => <tr key={claim.id}><td className="px-4 py-4"><p className="font-semibold text-gray-900">{claim.customer.name || "Chưa đặt tên"}</p><p className="text-xs text-gray-500">{claim.customer.email}</p></td><td className="px-4 py-4"><p className="font-medium">{claim.facebookName}</p>{claim.facebookProfileUrl && <a href={claim.facebookProfileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600">Mở trang cá nhân <ExternalLink className="h-3 w-3" /></a>}</td><td className="px-4 py-4 text-gray-600">{new Date(claim.createdAt).toLocaleString("vi-VN")}</td><td className="px-4 py-4"><span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold">{statusLabels[claim.status]}</span></td><td className="px-4 py-4"><div className="flex justify-end gap-2">{claim.status !== "REDEEMED" && <><button disabled={reviewing === claim.id} onClick={() => review(claim.id, "APPROVED")} title="Duyệt" className="grid h-9 w-9 place-items-center rounded-md border border-green-200 text-green-700 hover:bg-green-50"><Check className="h-4 w-4" /></button><button disabled={reviewing === claim.id} onClick={() => review(claim.id, "REJECTED")} title="Từ chối" className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"><X className="h-4 w-4" /></button></>}</div></td></tr>)}</tbody>
          </table>
          {!claims.length && <div className="py-12 text-center text-sm text-gray-500">Chưa có yêu cầu trong trạng thái này.</div>}
        </div>
      </section>
    </div>
  );
}
