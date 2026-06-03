"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, X, Save, Upload, Image as ImageIcon, Star } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/admin/ui/FormField";
import { FormSelect } from "@/components/admin/ui/FormSelect";
import { compressImage } from "@/lib/image";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductVariant {
  id: string;
  variantType: string;
  value: string;
  priceAdjustment: number;
  inventory: number;
  sku?: string;
}

interface ProductVariantOption {
  id: string;
  variantType: string;
  options: string[];
  image?: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  salePrice?: number | null;
  saleEndDate?: string | null;
  type: string;
  status: string;
  inventory: number;
  images: string[];
  category: Category;
  variants: ProductVariant[];
  variantOptions: ProductVariantOption[];
  careGuide?: {
    watering: string;
    sunlight: string;
    temperature: string;
    humidity: string;
    commonIssues?: string | null;
    videoUrl?: string | null;
  };
}

interface VariantOption {
  variantType: string;
  options: string[];
  image?: string;
}

const formatVND = (value: string | number) => {
  if (value === undefined || value === null) return "";
  const clean = String(value).replace(/\D/g, ""); // Keep only digits
  if (!clean) return "";
  return new Intl.NumberFormat("vi-VN").format(parseInt(clean));
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const subImageInputRef = useRef<HTMLInputElement>(null);
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSub, setUploadingSub] = useState(false);

  // Separate main image & sub images
  const [mainImage, setMainImage] = useState<string>("");
  const [subImages, setSubImages] = useState<string[]>([]);
  
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);

  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    basePrice: "",
    salePrice: "",      // Giá khuyến mãi
    saleEndDate: "",    // Thời hạn flash sale (hiển thị theo giờ VN)
    type: "PRODUCT",
    categoryId: "",
    status: "DRAFT",
    inventory: 0,
  });

  const [careGuide, setCareGuide] = useState({
    watering: "",
    sunlight: "",
    temperature: "",
    humidity: "",
    commonIssues: "",
    videoUrl: "",
  });

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?nocache=true");
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : (data.categories ?? []));
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);

        // Populate form data
        setFormData({
          slug: data.slug,
          name: data.name,
          basePrice: formatVND(data.basePrice),
          salePrice: data.salePrice != null ? formatVND(data.salePrice) : "",
          saleEndDate: data.saleEndDate
            ? (() => {
                // UTC → giờ VN, định dạng "YYYY-MM-DDTHH:mm" cho datetime-local
                const d = new Date(data.saleEndDate);
                const vnStr = d.toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
                return vnStr.slice(0, 16); // "YYYY-MM-DD HH:mm" → slice bỏ seconds
              })()
            : "",
          type: data.type,
          categoryId: data.categoryId || "",
          status: data.status,
          inventory: data.inventory || 0,
        });

        // Split main vs sub images
        setMainImage(data.images[0] || "");
        setSubImages(data.images.slice(1));

        setVariants(data.variants || []);
        setVariantOptions(data.variantOptions || []);

        if (data.careGuide) {
          setCareGuide({
            watering: data.careGuide.watering || "",
            sunlight: data.careGuide.sunlight || "",
            temperature: data.careGuide.temperature || "",
            humidity: data.careGuide.humidity || "",
            commonIssues: data.careGuide.commonIssues || "",
            videoUrl: data.careGuide.videoUrl || "",
          });
        }
      } else {
        toast.error("Không tìm thấy sản phẩm");
        router.push("/tiem-nho-nth24/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Lỗi khi tải thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  // Auto-slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append("file", compressed);
    fd.append("bucket", "products");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) { toast.error("Upload thất bại"); return null; }
    const data = await res.json();
    return data.url;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    const url = await uploadImage(file);
    if (url) { setMainImage(url); toast.success("Đã tải ảnh chính"); }
    setUploadingMain(false);
    if (mainImageInputRef.current) mainImageInputRef.current.value = "";
  };

  const handleSubImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (subImages.length + files.length > 10) {
      toast.error("Tối đa 10 ảnh phụ");
      return;
    }
    setUploadingSub(true);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    setSubImages((prev) => [...prev, ...urls]);
    if (urls.length) toast.success(`Đã tải ${urls.length} ảnh phụ`);
    setUploadingSub(false);
    if (subImageInputRef.current) subImageInputRef.current.value = "";
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: "",
        variantType: "SIZE",
        value: "",
        priceAdjustment: 0,
        inventory: 0,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: string, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleAddVariantOption = () => {
    const types = ["SIZE", "TYPE", "DECOR", "ACCESSORY"];
    const unusedType = types.find((t) => !variantOptions.some((v) => v.variantType === t));
    if (unusedType) {
      setVariantOptions([...variantOptions, { variantType: unusedType, options: [""] }]);
    } else {
      setVariantOptions([...variantOptions, { variantType: "CUSTOM", options: [""] }]);
    }
  };

  const handleRemoveVariantOption = (index: number) => {
    setVariantOptions(variantOptions.filter((_, i) => i !== index));
  };

  const handleVariantOptionTypeChange = (index: number, value: string) => {
    const newOptions = [...variantOptions];
    newOptions[index].variantType = value;
    setVariantOptions(newOptions);
  };

  const handleVariantOptionValueChange = (optionIndex: number, valueIndex: number, value: string) => {
    const newOptions = [...variantOptions];
    newOptions[optionIndex].options[valueIndex] = value;
    setVariantOptions(newOptions);
  };

  const handleAddVariantOptionValue = (index: number) => {
    const newOptions = [...variantOptions];
    newOptions[index].options.push("");
    setVariantOptions(newOptions);
  };

  const handleRemoveVariantOptionValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...variantOptions];
    newOptions[optionIndex].options = newOptions[optionIndex].options.filter(
      (_, i) => i !== valueIndex
    );
    setVariantOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainImage) { toast.error("Vui lòng tải ảnh chính sản phẩm"); return; }
    setSaving(true);

    try {
      const allImages = [mainImage, ...subImages.filter(Boolean)];
      const validVariantOptions = variantOptions.map((v) => ({
        ...v,
        options: v.options.filter((o) => o.trim() !== ""),
      })).filter((v) => v.options.length > 0);

      const cleanPrice = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/\./g, "")) || 0;
      };

      const productData = {
        ...formData,
        basePrice: cleanPrice(formData.basePrice),
        salePrice: formData.salePrice ? cleanPrice(formData.salePrice) : null,
        saleEndDate: formData.saleEndDate
          ? new Date(formData.saleEndDate + ":00+07:00").toISOString()
          : null,
        images: allImages,
        variants: variants.map((v) => ({
          ...v,
          priceAdjustment: parseFloat(v.priceAdjustment.toString()) || 0,
        })),
        variantOptions: validVariantOptions,
        careGuideData: {
          watering: careGuide.watering,
          sunlight: careGuide.sunlight,
          temperature: careGuide.temperature,
          humidity: careGuide.humidity,
          commonIssues: careGuide.commonIssues || null,
          videoUrl: careGuide.videoUrl || null,
        },
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast.success("Cập nhật sản phẩm thành công!");
        router.push("/tiem-nho-nth24/products");
      } else {
        const error = await response.json();
        toast.error(`Lỗi cập nhật sản phẩm: ${error.error || "Không rõ nguyên nhân"}`);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/tiem-nho-nth24/products"
          className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-4 gap-1 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Sản Phẩm</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Thông tin cơ bản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Tên sản phẩm *"
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              required
            />
            <FormField
              label="Slug (URL)"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
            <FormField
              label="Giá cơ bản (VNĐ) *"
              type="text"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: formatVND(e.target.value) })}
              required
              placeholder="299.000"
            />
            <FormField
              label="Giá khuyến mãi (VNĐ)"
              type="text"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: formatVND(e.target.value) })}
              placeholder="Để trống nếu không có khuyến mãi"
            />
            <FormField
              label="Tồn kho"
              type="number"
              value={formData.inventory}
              onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) || 0 })}
              min="0"
            />
            <FormSelect
              label="Danh mục"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={[{ label: "-- Chọn danh mục --", value: "" }, ...categories.map((c) => ({ label: c.name, value: c.id }))]}
            />
            <FormSelect
              label="Trạng thái"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { label: "Nháp", value: "DRAFT" },
                { label: "Đang bán", value: "ACTIVE" },
                { label: "Lưu trữ", value: "ARCHIVED" },
              ]}
            />
            {/* Flash Sale End Date — chỉ hiển khi có giá KM */}
            {formData.salePrice && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Thời Hạn Flash Sale <span className="text-[10px] text-[#425733] font-normal">(Giờ VN)</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.saleEndDate}
                  onChange={(e) => setFormData({ ...formData, saleEndDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#425733]/50"
                />
                <p className="text-xs text-gray-400 mt-1">Để trống nếu flash sale không có thời hạn</p>
              </div>
            )}
          </div>
        </div>

        {/* Biến thể sản phẩm */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-800">Biến thể sản phẩm</h3>
            <button
              type="button"
              onClick={handleAddVariant}
              className="flex items-center gap-2 text-sm text-[#425733] hover:text-[#364a29] font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm biến thể
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có biến thể nào. Nhấn "Thêm biến thể" để tạo.</p>
          ) : (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-6 gap-4 items-end bg-gray-50">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Loại</label>
                    <select
                      value={variant.variantType}
                      onChange={(e) => handleVariantChange(index, "variantType", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm bg-white"
                    >
                      <option value="SIZE">Size (Kích thước)</option>
                      <option value="TYPE">Type (Thể loại)</option>
                      <option value="DECOR">Decor (Phụ kiện trí)</option>
                      <option value="ACCESSORY">Accessory (Bộ chăm sóc)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Giá trị</label>
                    <input
                      type="text"
                      value={variant.value}
                      onChange={(e) => handleVariantChange(index, "value", e.target.value)}
                      placeholder="VD: Nhỏ, Vỏ ốc..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Giá tăng thêm</label>
                    <input
                      type="number"
                      value={variant.priceAdjustment}
                      onChange={(e) => handleVariantChange(index, "priceAdjustment", parseFloat(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tồn kho</label>
                    <input
                      type="number"
                      value={variant.inventory}
                      onChange={(e) => handleVariantChange(index, "inventory", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">SKU</label>
                    <input
                      type="text"
                      value={variant.sku || ""}
                      onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                      placeholder="Mã SKU"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm bg-white"
                    />
                  </div>
                  <div className="flex justify-end sm:justify-start items-center h-full pb-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ảnh sản phẩm */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-5">Ảnh sản phẩm</h3>

          {/* Ảnh chính */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-gray-700">Ảnh chính</span>
              <span className="text-xs text-gray-400">(bắt buộc · hiển thị ở listing)</span>
            </div>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div
                onClick={() => mainImageInputRef.current?.click()}
                className={`relative w-40 h-40 rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                  mainImage
                    ? "border-[#425733] shadow-md"
                    : "border-dashed border-gray-300 hover:border-[#425733] bg-gray-50"
                }`}
              >
                {mainImage ? (
                  <>
                    <Image src={mainImage} alt="Ảnh chính" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-medium opacity-0 hover:opacity-100">Đổi ảnh</span>
                    </div>
                    <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-white" /> Chính
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                    {uploadingMain ? (
                      <div className="w-6 h-6 border-2 border-[#425733] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-xs text-center px-2">Nhấn để tải ảnh chính</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">Ảnh chính hiển thị trong danh sách sản phẩm và trang chi tiết. Khuyến nghị: tỷ lệ 1:1, tối thiểu 600×600px.</p>
                <button
                  type="button"
                  onClick={() => mainImageInputRef.current?.click()}
                  disabled={uploadingMain}
                  className="flex items-center gap-2 bg-[#425733] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#364a29] disabled:opacity-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingMain ? "Đang tải..." : mainImage ? "Thay ảnh chính" : "Tải ảnh chính"}
                </button>
              </div>
            </div>
          </div>

          {/* Ảnh phụ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Ảnh phụ</span>
                <span className="text-xs text-gray-400">(tùy chọn · tối đa 10 ảnh)</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                subImages.length >= 10 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
              }`}>
                {subImages.length}/10
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-3">
              {subImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  <Image src={img} alt={`Ảnh phụ ${idx + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setSubImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {subImages.length < 10 && (
                <button
                  type="button"
                  onClick={() => subImageInputRef.current?.click()}
                  disabled={uploadingSub}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#425733] bg-gray-50 hover:bg-[#f5f7f4] transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#425733]"
                >
                  {uploadingSub ? (
                    <div className="w-5 h-5 border-2 border-[#425733] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px]">Thêm</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => subImageInputRef.current?.click()}
              disabled={uploadingSub || subImages.length >= 10}
              className="flex items-center gap-2 text-sm text-[#425733] hover:text-[#364a29] font-medium disabled:opacity-40 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {uploadingSub ? "Đang tải ảnh phụ..." : "Tải nhiều ảnh phụ cùng lúc"}
            </button>
          </div>

          {/* Hidden inputs */}
          <input ref={mainImageInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
          <input ref={subImageInputRef} type="file" accept="image/*" multiple onChange={handleSubImageUpload} className="hidden" />
        </div>

        {/* Tùy chọn hiển thị */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-800">Tùy chọn hiển thị (Display Options)</h3>
            <button
              type="button"
              onClick={handleAddVariantOption}
              className="flex items-center gap-2 text-sm text-[#425733] hover:text-[#364a29] font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm nhóm biến thể
            </button>
          </div>

          {variantOptions.length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có cài đặt tùy chọn hiển thị nào.</p>
          ) : (
            <div className="space-y-4">
              {variantOptions.map((option, index) => (
                <div key={index} className="border rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <select
                      value={option.variantType}
                      onChange={(e) => handleVariantOptionTypeChange(index, e.target.value)}
                      className="px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm bg-white"
                    >
                      <option value="SIZE">Size (Kích thước)</option>
                      <option value="TYPE">Type (Thể loại)</option>
                      <option value="DECOR">Decor (Phụ kiện trí)</option>
                      <option value="ACCESSORY">Accessory (Bộ chăm sóc)</option>
                      <option value="CUSTOM">Tùy chọn khác</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariantOption(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {option.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            handleVariantOptionValueChange(index, optIndex, e.target.value)
                          }
                          placeholder="Nhập giá trị"
                          className="px-3 py-1 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm bg-white"
                        />
                        {option.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantOptionValue(index, optIndex)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddVariantOptionValue(index)}
                      className="text-[#425733] hover:text-[#364a29] text-xs font-semibold px-2 py-1 rounded hover:bg-gray-200/50"
                    >
                      + Thêm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hướng dẫn chăm sóc */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🪴</span>
            <h3 className="text-base font-semibold text-gray-800">Hướng Dẫn Chăm Sóc</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Tưới nước"
              type="text"
              value={careGuide.watering}
              onChange={(e) => setCareGuide({ ...careGuide, watering: e.target.value })}
              placeholder="VD: Tưới 2-3 lần/tuần, tránh đọng nước"
            />
            <FormField
              label="Ánh sáng"
              type="text"
              value={careGuide.sunlight}
              onChange={(e) => setCareGuide({ ...careGuide, sunlight: e.target.value })}
              placeholder="VD: Ánh sáng gián tiếp, tránh nắng trực tiếp"
            />
            <FormField
              label="Nhiệt độ"
              type="text"
              value={careGuide.temperature}
              onChange={(e) => setCareGuide({ ...careGuide, temperature: e.target.value })}
              placeholder="VD: 18-25°C"
            />
            <FormField
              label="Độ ẩm"
              type="text"
              value={careGuide.humidity}
              onChange={(e) => setCareGuide({ ...careGuide, humidity: e.target.value })}
              placeholder="VD: 60-80%"
            />
            <div className="md:col-span-2">
              <FormField
                label="Vấn đề thường gặp & cách xử lý"
                multiline
                rows={3}
                value={careGuide.commonIssues}
                onChange={(e) => setCareGuide({ ...careGuide, commonIssues: e.target.value })}
                placeholder="VD: Lá vàng → giảm tưới nước; Mốc trắng → tăng thông thoáng"
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="Video hướng dẫn (URL)"
                type="url"
                value={careGuide.videoUrl}
                onChange={(e) => setCareGuide({ ...careGuide, videoUrl: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end gap-3">
          <Link
            href="/tiem-nho-nth24/products"
            className="px-6 py-2.5 border border-gray-200 rounded-full text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#425733] text-white px-6 py-2.5 rounded-full font-semibold text-sm shadow hover:-translate-y-0.5 hover:bg-[#364a29] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}