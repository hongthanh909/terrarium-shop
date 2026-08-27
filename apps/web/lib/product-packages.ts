export type ProductPackageKey = "basic" | "standard" | "advanced";

export type ProductPackagePricing = {
  packageOptionsEnabled?: boolean | null;
  standardPackageAdjustment?: number | string | { toString(): string } | null;
  advancedPackageAdjustment?: number | string | { toString(): string } | null;
};

export const DEFAULT_PRODUCT_PACKAGE_PRICE_ADJUSTMENTS: Record<ProductPackageKey, number> = {
  basic: 0,
  standard: 100000,
  advanced: 120000,
};

export const PRODUCT_PACKAGE_LABELS: Record<ProductPackageKey, string> = {
  basic: "Gói cơ bản",
  standard: "Gói tiêu chuẩn",
  advanced: "Gói nâng cao",
};

function toSafePrice(value: ProductPackagePricing[keyof ProductPackagePricing], fallback: number) {
  if (value == null) return fallback;
  const parsed = Number(typeof value === "object" ? value.toString() : value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function isProductPackageEnabled(product?: ProductPackagePricing | null) {
  return product?.packageOptionsEnabled !== false;
}

export function getProductPackagePriceAdjustment(
  packageKey: unknown,
  product?: ProductPackagePricing | null,
) {
  if (packageKey === "standard") {
    return toSafePrice(
      product?.standardPackageAdjustment,
      DEFAULT_PRODUCT_PACKAGE_PRICE_ADJUSTMENTS.standard,
    );
  }

  if (packageKey === "advanced") {
    return toSafePrice(
      product?.advancedPackageAdjustment,
      DEFAULT_PRODUCT_PACKAGE_PRICE_ADJUSTMENTS.advanced,
    );
  }

  return 0;
}

export function getProductPackageKey(value: unknown): ProductPackageKey {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("advanced") || normalized.includes("nang cao")) return "advanced";
  if (normalized.includes("standard") || normalized.includes("tieu chuan")) return "standard";
  return "basic";
}
