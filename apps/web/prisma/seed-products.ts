/**
 * Seed script — Tạo Categories + 15 sản phẩm terrarium
 * Chạy: npx prisma db seed
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

const IMGS = {
  mini1:     "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
  mini2:     "https://images.unsplash.com/photo-1585059895524-72359e06133a?w=600&q=80",
  sphere:    "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&q=80",
  diy:       "https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=600&q=80",
  moss1:     "https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=600&q=80",
  moss2:     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  lichen:    "https://images.unsplash.com/photo-1503264116251-35a269479413?w=600&q=80",
  desert:    "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=600&q=80",
  hanging:   "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&q=80",
  driftwood: "https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=600&q=80",
  square:    "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=600&q=80",
  tropical:  "https://images.unsplash.com/photo-1518335935020-cfd6580c1ab4?w=600&q=80",
  fern:      "https://images.unsplash.com/photo-1503264116251-35a269479413?w=600&q=80",
  vivarium:  "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=600&q=80",
  wall:      "https://images.unsplash.com/photo-1598335726432-3b3d6af27df7?w=600&q=80",
};

async function main() {
  console.log("🌿 Bắt đầu seed dữ liệu terrarium shop...\n");

  // ── Tạo Categories ───────────────────────────────────────────────────────
  console.log("📂 Tạo danh mục...");
  const catStudent = await prisma.category.upsert({
    where:  { slug: "bo-gia-sinh-vien" },
    update: { name: "Bộ Giá Sinh Viên" },
    create: { slug: "bo-gia-sinh-vien", name: "Bộ Giá Sinh Viên" },
  });
  const catBasic = await prisma.category.upsert({
    where:  { slug: "bo-basic" },
    update: { name: "Bộ Basic" },
    create: { slug: "bo-basic", name: "Bộ Basic" },
  });
  const catRain = await prisma.category.upsert({
    where:  { slug: "bo-mua-premium" },
    update: { name: "Bộ Mưa - Premium" },
    create: { slug: "bo-mua-premium", name: "Bộ Mưa - Premium" },
  });
  console.log(`  ✅ ${catStudent.name} (${catStudent.id})`);
  console.log(`  ✅ ${catBasic.name} (${catBasic.id})`);
  console.log(`  ✅ ${catRain.name} (${catRain.id})`);

  // ── Tạo Settings mặc định ────────────────────────────────────────────────
  console.log("\n⚙️  Tạo settings mặc định...");
  const settings = [
    { key: "site_name",    value: "Tiệm Rêu - Terrarium Shop" },
    { key: "site_phone",   value: "0123456789" },
    { key: "site_email",   value: "tiemreudecor@gmail.com" },
    { key: "site_address", value: "TP. Hồ Chí Minh" },
    { key: "zalo_url",     value: "https://zalo.me/0123456789" },
    { key: "facebook_url", value: "https://facebook.com/tiemreudecor" },
    { key: "free_shipping_threshold", value: "500000" },
  ];
  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where:  { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  console.log(`  ✅ ${settings.length} settings`);

  // ── Seed Products ────────────────────────────────────────────────────────
  console.log("\n🪴 Seed sản phẩm...");

  type ProductSeed = {
    slug: string; name: string; basePrice: number;
    salePrice?: number; inventory: number; featured: boolean;
    catId: string; images: string[];
  };

  const products: ProductSeed[] = [
    // Bộ Giá Sinh Viên
    { slug: "terrarium-co-ban-mini",      name: "Terrarium Cơ Bản Mini",          basePrice: 250000,             inventory: 20, featured: false, catId: catStudent.id, images: [IMGS.mini1, IMGS.mini2] },
    { slug: "terrarium-hinh-cau-nho",     name: "Terrarium Hình Cầu",             basePrice: 350000, salePrice: 299000, inventory: 15, featured: true,  catId: catStudent.id, images: [IMGS.sphere, IMGS.mini1] },
    { slug: "bo-terrarium-tu-lam-diy",    name: "Bộ Tự Làm Terrarium DIY",        basePrice: 280000,             inventory: 30, featured: false, catId: catStudent.id, images: [IMGS.diy, IMGS.mini2] },
    // Bộ Basic
    { slug: "terrarium-reu-xanh-tron",    name: "Terrarium Rêu Xanh Tươi",        basePrice: 480000, salePrice: 420000, inventory: 12, featured: true,  catId: catBasic.id, images: [IMGS.moss1, IMGS.moss2] },
    { slug: "terrarium-dia-y-tu-nhien",   name: "Terrarium Địa Y Tự Nhiên",       basePrice: 550000,             inventory: 8,  featured: false, catId: catBasic.id, images: [IMGS.lichen, IMGS.moss1] },
    { slug: "terrarium-sa-mac-xuong-rong",name: "Terrarium Sa Mạc Xương Rồng",    basePrice: 680000,             inventory: 10, featured: true,  catId: catBasic.id, images: [IMGS.desert, IMGS.square] },
    { slug: "binh-thuy-tinh-treo-tuong",  name: "Terrarium Treo Tường Hình Giọt", basePrice: 420000,             inventory: 18, featured: false, catId: catBasic.id, images: [IMGS.hanging, IMGS.sphere] },
    { slug: "terrarium-go-lua-trang-tri", name: "Terrarium Gỗ Lũa Nghệ Thuật",   basePrice: 850000, salePrice: 750000, inventory: 6,  featured: true,  catId: catBasic.id, images: [IMGS.driftwood, IMGS.moss2] },
    { slug: "terrarium-vuong-mica",       name: "Terrarium Vuông Mica Hiện Đại",  basePrice: 580000,             inventory: 14, featured: false, catId: catBasic.id, images: [IMGS.square, IMGS.diy] },
    // Bộ Mưa - Premium
    { slug: "terrarium-rung-nhiet-doi",   name: "Terrarium Rừng Nhiệt Đới Mini",  basePrice: 1200000, salePrice: 980000, inventory: 5, featured: true, catId: catRain.id, images: [IMGS.tropical, IMGS.fern] },
    { slug: "terrarium-duong-xi-reu",     name: "Terrarium Dương Xỉ & Rêu",      basePrice: 1500000,            inventory: 4,  featured: true,  catId: catRain.id, images: [IMGS.fern, IMGS.tropical] },
    { slug: "terrarium-reu-da-tong-hop",  name: "Terrarium Rêu & Đá Tổng Hợp",   basePrice: 980000,             inventory: 7,  featured: false, catId: catRain.id, images: [IMGS.moss2, IMGS.driftwood] },
    { slug: "terrarium-tuong-reu-mini",   name: "Tường Rêu Treo Tường",           basePrice: 850000, salePrice: 780000, inventory: 9, featured: false, catId: catRain.id, images: [IMGS.wall, IMGS.moss1] },
    { slug: "vivarium-ban-am-cao-cap",    name: "Vivarium Bán Ẩm Cao Cấp",        basePrice: 2200000,            inventory: 3,  featured: true,  catId: catRain.id, images: [IMGS.vivarium, IMGS.tropical] },
    { slug: "bo-rainforest-premium",      name: "Bộ Rainforest Premium",          basePrice: 2500000, salePrice: 2200000, inventory: 2, featured: true, catId: catRain.id, images: [IMGS.vivarium, IMGS.fern, IMGS.tropical] },
  ];

  let success = 0, skip = 0;
  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) { console.log(`  ⏭  Bỏ qua: ${p.name}`); skip++; continue; }

    await prisma.product.create({
      data: {
        slug:       p.slug,
        name:       p.name,
        basePrice:  p.basePrice,
        salePrice:  p.salePrice ?? null,
        inventory:  p.inventory,
        featured:   p.featured,
        status:     "ACTIVE",
        categoryId: p.catId,
        images:     p.images,
        type:       "PRODUCT",
      },
    });

    const price = p.salePrice
      ? `${p.basePrice.toLocaleString("vi-VN")}đ → ${p.salePrice.toLocaleString("vi-VN")}đ`
      : `${p.basePrice.toLocaleString("vi-VN")}đ`;
    console.log(`  ✅ ${p.name} (${price})`);
    success++;
  }

  console.log(`\n🎉 Xong! Thêm: ${success} SP | Bỏ qua: ${skip} SP`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
