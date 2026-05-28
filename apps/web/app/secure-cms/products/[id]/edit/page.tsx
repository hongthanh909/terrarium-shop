"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, X, Save, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/admin/ui/FormField";
import { FormSelect } from "@/components/admin/ui/FormSelect";

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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [images, setImages] = useState<string[]>([""]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    basePrice: "",
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
      const response = await fetch("/api/categories");
      const data = await response.json();
      // API trả { categories: [...], pagination: {...} } hoặc array trực tiếp
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
          basePrice: data.basePrice.toString(),
          type: data.type,
          categoryId: data.categoryId || "",
          status: data.status,
          inventory: data.inventory || 0,
        });

        setImages(data.images.length > 0 ? data.images : [""]);
        setVariants(data.variants || []);
        setVariantOptions(data.variantOptions || []);

        if (data.careGuide) {
          setCareGuide(data.careGuide);
        }
      } else {
        toast.error("Product not found");
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Error loading product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    setImages([...images, ""]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "products");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        const emptyIndex = images.findIndex((img) => img === "");
        if (emptyIndex > -1) {
          const newImages = [...images];
          newImages[emptyIndex] = data.url;
          setImages(newImages);
        } else {
          setImages([...images, data.url]);
        }
      } else {
        const error = await response.json();
        toast.error(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error uploading image");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
    setSaving(true);

    try {
      const validImages = images.filter((img) => img.trim() !== "");
      const validVariantOptions = variantOptions.map((v) => ({
        ...v,
        options: v.options.filter((o) => o.trim() !== ""),
      })).filter((v) => v.options.length > 0);

      const productData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice) || 0,
        images: validImages,
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
        toast.success("Product updated successfully!");
        router.push("/admin/products");
      } else {
        const error = await response.json();
        toast.error(`Failed to update product: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error updating product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading product...</p>
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
          href="/admin/products"
          className="inline-flex items-center text-[#425733] hover:text-[#425733] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
        <h2 className="text-3xl font-bold text-gray-800">Edit Product</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Product Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <FormField
              label="Slug"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
            <FormField
              label="Base Price (VND)"
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              required
              min="0"
            />
            <FormField
              label="Inventory"
              type="number"
              value={formData.inventory}
              onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) || 0 })}
              min="0"
            />
            <FormSelect
              label="Category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
            />
            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { label: "Draft", value: "DRAFT" },
                { label: "Active", value: "ACTIVE" },
                { label: "Archived", value: "ARCHIVED" },
              ]}
            />
          </div>
        </div>

        {/* Product Variants */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Product Variants</h3>
            <button
              type="button"
              onClick={handleAddVariant}
              className="flex items-center gap-2 text-[#425733] hover:text-[#425733]"
            >
              <Plus className="w-4 h-4" />
              Add Variant
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="text-gray-500 text-sm">No variants added. Click "Add Variant" to start.</p>
          ) : (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="border rounded-lg p-4 grid grid-cols-6 gap-4 items-start">
                  <div>
                    <label className="block text-xs font-medium mb-1">Type</label>
                    <select
                      value={variant.variantType}
                      onChange={(e) => handleVariantChange(index, "variantType", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm"
                    >
                      <option value="SIZE">Size</option>
                      <option value="TYPE">Type</option>
                      <option value="DECOR">Decor</option>
                      <option value="ACCESSORY">Accessory</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Value</label>
                    <input
                      type="text"
                      value={variant.value}
                      onChange={(e) => handleVariantChange(index, "value", e.target.value)}
                      placeholder="e.g., Small"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Price Adj.</label>
                    <input
                      type="number"
                      value={variant.priceAdjustment}
                      onChange={(e) => handleVariantChange(index, "priceAdjustment", parseFloat(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Inventory</label>
                    <input
                      type="number"
                      value={variant.inventory}
                      onChange={(e) => handleVariantChange(index, "inventory", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">SKU</label>
                    <input
                      type="text"
                      value={variant.sku || ""}
                      onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                      placeholder="SKU"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Product Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                {image ? (
                  <div className="relative">
                    <Image
                      src={image}
                      alt={`Product image ${index + 1}`}
                      width={400}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#6d8c5a] transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload</span>
                    {uploading && <span className="text-xs text-[#425733] mt-1">Uploading...</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-[#425733] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-[#425733] text-white px-4 py-2 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(66,87,51,0.3)] hover:bg-[#364a29] disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {uploading ? `Uploading... ${uploadProgress}%` : "Upload Image"}
            </button>
            <button
              type="button"
              onClick={handleAddImage}
              className="flex items-center gap-2 text-[#425733] hover:text-[#425733]"
            >
              <Plus className="w-4 h-4" />
              Add Slot
            </button>
          </div>
        </div>

        {/* Variant Options (Display Options) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Variant Options (Display)</h3>
            <button
              type="button"
              onClick={handleAddVariantOption}
              className="flex items-center gap-2 text-[#425733] hover:text-[#425733]"
            >
              <Plus className="w-4 h-4" />
              Add Variant Type
            </button>
          </div>

          {variantOptions.length === 0 ? (
            <p className="text-gray-500 text-sm">No variant options added.</p>
          ) : (
            <div className="space-y-4">
              {variantOptions.map((option, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <select
                      value={option.variantType}
                      onChange={(e) => handleVariantOptionTypeChange(index, e.target.value)}
                      className="px-3 py-1 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a]"
                    >
                      <option value="SIZE">Size</option>
                      <option value="TYPE">Type</option>
                      <option value="DECOR">Decor</option>
                      <option value="ACCESSORY">Accessory</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariantOption(index)}
                      className="text-red-600 hover:text-red-700"
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
                          placeholder="Option value"
                          className="px-3 py-1 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] text-sm"
                        />
                        {option.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantOptionValue(index, optIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddVariantOptionValue(index)}
                      className="text-[#425733] hover:text-[#425733] text-sm"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Care Guide */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🌿</span>
            <h3 className="text-xl font-semibold">Hướng Dẫn Chăm Sóc</h3>
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
                value={careGuide.commonIssues || ""}
                onChange={(e) => setCareGuide({ ...careGuide, commonIssues: e.target.value })}
                placeholder="VD: Lá vàng → giảm tưới nước; Mốc trắng → tăng thông thoáng"
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="Video hướng dẫn (URL)"
                type="url"
                value={careGuide.videoUrl || ""}
                onChange={(e) => setCareGuide({ ...careGuide, videoUrl: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/products"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover:bg-[#364a29] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}