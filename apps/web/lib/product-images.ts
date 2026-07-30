const RETIRED_PRODUCT_IMAGE_IDS = [
  "photo-1542601906897-ecd70eeadbad",
  "photo-1502780402662-acc01917735e",
] as const;

export function sanitizeProductImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];

  return images.filter((image): image is string => {
    if (typeof image !== "string" || image.trim() === "") return false;
    return !RETIRED_PRODUCT_IMAGE_IDS.some((imageId) => image.includes(imageId));
  });
}

export function getPrimaryProductImage(images: unknown): string {
  return sanitizeProductImages(images)[0] ?? "";
}
