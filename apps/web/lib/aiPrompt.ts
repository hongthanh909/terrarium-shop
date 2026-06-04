// aiPrompt.ts – defines the prompt template for product recommendation AI

/**
 * Generates a prompt for the Ollama model using product data.
 * Fields match the actual Prisma Product model:
 * - name: string
 * - basePrice: Decimal (serialized as string)
 * - category: { name: string } | null
 * - images: string[]  (array of image URLs)
 */
export function buildProductPrompt(product: {
  name: string;
  basePrice: { toString: () => string } | number | string;
  category: { name: string } | null;
  images: string[];
}): string {
  const categoryName = product.category?.name ?? "không xác định";
  const imageList = product.images.slice(0, 3).join(", ");
  const priceStr = Number(product.basePrice.toString()).toLocaleString("vi-VN");

  return `
Bạn là trợ lý AI của Tiệm Rêu. Dựa trên các thông tin sản phẩm sau, hãy:
1. Gợi ý 2‑3 sản phẩm phù hợp cùng danh mục hoặc phụ kiện.
2. Cung cấp hướng dẫn chăm sóc và bảo hành cho sản phẩm hiện tại.
3. Đưa ra lời khuyên ngắn gọn cho khách hàng.

Thông tin sản phẩm:
- Tên: ${product.name}
- Giá: ${priceStr} VND
- Danh mục: ${categoryName}
- Ảnh: ${imageList}

Trả lời dưới dạng markdown, bao gồm các phần:
**Sản phẩm đề xuất** (tên, slug giả, giá), **Chăm sóc**, **Bảo hành**.
`;
}
