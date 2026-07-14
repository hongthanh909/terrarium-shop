export type ProductPackageKey = "basic" | "standard" | "advanced";

export const PRODUCT_PACKAGE_PRICE_ADJUSTMENTS: Record<ProductPackageKey, number> = {
  basic: 0,
  standard: 100000,
  advanced: 120000,
};

export function getProductPackagePriceAdjustment(packageKey: unknown) {
  if (
    packageKey === "basic" ||
    packageKey === "standard" ||
    packageKey === "advanced"
  ) {
    return PRODUCT_PACKAGE_PRICE_ADJUSTMENTS[packageKey];
  }

  return 0;
}
