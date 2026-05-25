"use client";

import { useState, useEffect } from "react";
import { Settings, Store, Globe, Bell, Shield, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShopSettings {
  shopName: string;
  shopEmail: string;
  shopPhone: string;
  shopAddress: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankBranch: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: "Tiệm Rêu Decor",
    shopEmail: "contact@tiemreudecor.vn",
    shopPhone: "0912 345 678",
    shopAddress: "TP. Hồ Chí Minh, Việt Nam",
    bankName: "Vietcombank",
    bankAccountNumber: "",
    bankAccountName: "",
    bankBranch: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof ShopSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Lưu settings vào DB hoặc API khi sẵn sàng
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#425733]" />
            Cài đặt cửa hàng
          </h2>
          <p className="text-gray-500 mt-1">Quản lý thông tin cửa hàng và cấu hình hệ thống</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#425733] hover:bg-[#364a29] text-white gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang lưu...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Đã lưu
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>

      {/* Thông tin cửa hàng */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Store className="w-5 h-5 text-[#425733]" />
          <h3 className="font-semibold text-gray-800">Thông tin cửa hàng</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên cửa hàng</label>
              <Input
                value={settings.shopName}
                onChange={(e) => handleChange("shopName", e.target.value)}
                className="border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email liên hệ</label>
              <Input
                type="email"
                value={settings.shopEmail}
                onChange={(e) => handleChange("shopEmail", e.target.value)}
                className="border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
              <Input
                value={settings.shopPhone}
                onChange={(e) => handleChange("shopPhone", e.target.value)}
                className="border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
              <Input
                value={settings.shopAddress}
                onChange={(e) => handleChange("shopAddress", e.target.value)}
                className="border-gray-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Thông tin ngân hàng */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#425733]" />
          <h3 className="font-semibold text-gray-800">Thông tin thanh toán (Chuyển khoản)</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngân hàng</label>
              <Input
                value={settings.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
                placeholder="VD: Vietcombank"
                className="border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số tài khoản</label>
              <Input
                value={settings.bankAccountNumber}
                onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
                placeholder="VD: 0123456789"
                className="border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên chủ tài khoản</label>
              <Input
                value={settings.bankAccountName}
                onChange={(e) => handleChange("bankAccountName", e.target.value)}
                placeholder="VD: NGUYEN VAN A"
                className="border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi nhánh</label>
              <Input
                value={settings.bankBranch}
                onChange={(e) => handleChange("bankBranch", e.target.value)}
                placeholder="VD: CN Hồ Chí Minh"
                className="border-gray-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Thông tin hệ thống */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#425733]" />
          <h3 className="font-semibold text-gray-800">Thông tin hệ thống</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Framework</span>
              <span className="font-medium text-gray-800">Next.js 14.2.5</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Database</span>
              <span className="font-medium text-gray-800">PostgreSQL (Supabase)</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Auth</span>
              <span className="font-medium text-gray-800">NextAuth JWT</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Storage</span>
              <span className="font-medium text-gray-800">Supabase Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications placeholder */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#425733]" />
          <h3 className="font-semibold text-gray-800">Thông báo</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Email thông báo đơn hàng mới</p>
              <p className="text-sm text-gray-500 mt-0.5">Nhận email khi có đơn hàng mới từ khách</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#425733]"></div>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
