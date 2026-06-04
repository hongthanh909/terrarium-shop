// aiPrompt.ts – defines the prompt template for product recommendation AI

/**
 * Generates a prompt for the Ollama model using product data.
 * Only the essential fields are included (name, description, price, category, image URLs).
 * The prompt asks the model to suggest complementary products, care instructions,
 * and warranty advice.
 */
export function buildProductPrompt(product: {
  name: string;
  description: string;
  price: number;
  category: { name: string } | null;
  images: { url: string }[];
}): string {
  const categoryName = product.category?.name ?? "không xác định";
  const imageList = product.images.map((i) => i.url).join(", ");

  return `
Bạn là trợ lý AI của Tiệm Rêu. Dựa trên các thông tin sản phẩm sau, hãy:
1. Gợi ý 2‑3 sản phẩm phù hợp cùng danh mục hoặc phụ kiện.
2. Cung cấp hướng dẫn chăm sóc và bảo hành cho sản phẩm hiện tại.
3. Đưa ra lời khuyên ngắn gọn cho khách hàng.

Thông tin sản phẩm:
- Tên: ${product.name}
- Mô tả: ${product.description}
- Giá: ${product.price.toLocaleString('vi-VN')} VND
- Danh mục: ${categoryName}
- Ảnh: ${imageList}

Trả lời dưới dạng markdown, bao gồm các phần:
**Sản phẩm đề xuất** (tên, slug giả, giá), **Chăm sóc**, **Bảo hành**.
`; 
}
