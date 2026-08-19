function normalizeProvince(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const HO_CHI_MINH_ALIASES = new Set([
  "ho chi minh",
  "thanh pho ho chi minh",
  "tp ho chi minh",
  "tp hcm",
  "tphcm",
  "thanh pho hcm",
  "hcm",
  "sai gon",
]);

export function isHoChiMinhProvince(province: string | null | undefined) {
  return HO_CHI_MINH_ALIASES.has(normalizeProvince(province));
}

export function requiresShippingQuote(province: string | null | undefined) {
  const normalized = normalizeProvince(province);
  return Boolean(normalized) && !HO_CHI_MINH_ALIASES.has(normalized);
}
