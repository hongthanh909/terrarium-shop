import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed Policies
  const policies = [
    {
      slug: 'warranty',
      title: 'Chính sách bảo hành',
      content: `Chúng tôi cam kết bảo hành tất cả các sản phẩm terrarium trong vòng 30 ngày kể từ ngày mua.

Điều kiện bảo hành:
- Sản phẩm bị lỗi do nhà sản xuất
- Cây cối phai úa hoặc chết trong vòng 30 ngày (điều kiện đã được hướng dẫn chăm sóc)
- Sản phẩm không đúng mô tả

Để được bảo hành, vui lòng liên hệ qua email hoặc hotline với hình ảnh và hóa đơn mua hàng.`,
      type: 'warranty',
      order: 1,
    },
    {
      slug: 'shipping',
      title: 'Chính sách vận chuyển',
      content: `Thông tin vận chuyển:

- Miễn phí vận chuyển cho đơn hàng từ 500,000₫ trở lên
- Phí vận chuyển tiêu chuẩn: 30,000₫ - 50,000₫
- Thời gian giao hàng: 2-5 ngày làm việc (tại HCM), 3-7 ngày (toàn quốc)
- Đối tác vận chuyển: GHN, Grab Express

Theo dõi đơn hàng:
Số tracking sẽ được gửi qua SMS/Email sau khi đơn hàng đã được xác nhận.`,
      type: 'shipping',
      order: 2,
    },
    {
      slug: 'returns',
      title: 'Chính sách đổi trả',
      content: `Chúng tôi chấp nhận đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu:

1. Sản phẩm bị lỗi do nhà sản xuất
2. Sản phẩm không đúng mẫu mã, kích thước
3. Sản phẩm không hoạt động (nếu là sản phẩm có đèn, bơm...)

Điều kiện:
- Sản phẩm còn nguyên vẹn, chưa qua sử dụng
- Có đầy đủ bao bì, phụ kiện
- Không áp dụng cho các sản phẩm đã được cá nhân hóa theo yêu cầu

Chi phí đổi trả: Miễn phí nếu lỗi từ phía chúng tôi.`,
      type: 'returns',
      order: 3,
    },
    {
      slug: 'privacy',
      title: 'Chính sách bảo mật',
      content: `Cam kết bảo vệ thông tin cá nhân của khách hàng:

Thông tin thu thập:
- Họ tên, địa chỉ email, số điện thoại
- Địa chỉ giao hàng
- Lịch sử mua hàng (nếu có tài khoản)

Mục đích sử dụng:
- Xử lý đơn hàng và giao hàng
- Gửi thông tin khuyến mãi (có thể hủy đăng ký bất kỳ lúc nào)
- Cải thiện dịch vụ

Bảo mật:
- Không bán hoặc chia sẻ thông tin với bên thứ ba
- Sử dụng SSL mã hóa mọi giao dịch
- Lưu trữ an toàn theo tiêu chuẩn`,
      type: 'privacy',
      order: 4,
    },
    {
      slug: 'faq',
      title: 'Câu hỏi thường gặp',
      content: `**Terrarium cần chăm sóc như thế nào?**
Terrarium của chúng tôi được thiết kế để tự cân bằng. Chỉ cần đặt nơi có ánh sáng nhẹ và tưới nước rất ít (1-2 lần/tuần).

**Có thể tùy chỉnh terrarium không?**
Có! Chúng tôi cung cấp dịch vụ custom terrarium theo yêu cầu.

**Cây trong terrarium có sống lâu không?**
Các loại cây được chọn lọc kỹ để sống trong môi trường kín. Với chăm sóc đúng, có thể sống từ 1-3 năm.

**Có hỗ trợ giao hàng quốc tế không?**
Hiện tại chúng tôi chỉ giao hàng trong Việt Nam.`,
      type: 'faq',
      order: 5,
    },
  ];

  for (const policy of policies) {
    await prisma.policy.upsert({
      where: { slug: policy.slug },
      update: policy,
      create: policy,
    });
  }
  console.log('✅ Seeded policies');

  // Seed Contact Info
  const contactInfos = [
    {
      type: 'email',
      label: 'Email',
      value: 'tiemreudecor@gmail.com',
      orderIndex: 1,
      isActive: true,
      metadata: { icon: 'Mail' },
    },
    {
      type: 'phone',
      label: 'Hotline',
      value: '0706 668 296',
      orderIndex: 2,
      isActive: true,
      metadata: { icon: 'Phone' },
    },
    {
      type: 'address',
      label: 'Địa chỉ',
      value: '32/16 Tam Đa, Phường Long Trường, TP. Hồ Chí Minh',
      orderIndex: 3,
      isActive: true,
      metadata: { icon: 'MapPin' },
    },
    {
      type: 'working_hours',
      label: 'Giờ làm việc',
      value: 'Thứ 2 - Chủ nhật: 9:00 - 21:00',
      orderIndex: 4,
      isActive: true,
      metadata: { icon: 'Clock' },
    },
    {
      type: 'social',
      label: 'TikTok',
      value: 'https://www.tiktok.com/@tiemreudecor?lang=vi-VN',
      orderIndex: 5,
      isActive: true,
      metadata: { icon: 'TikTok' },
    },
    {
      type: 'social',
      label: 'Instagram',
      value: 'https://www.instagram.com/tiemreudecor/',
      orderIndex: 6,
      isActive: true,
      metadata: { icon: 'Instagram' },
    },
    {
      type: 'social',
      label: 'Facebook',
      value: 'https://www.facebook.com/tiemreudecor',
      orderIndex: 7,
      isActive: true,
      metadata: { icon: 'Facebook' },
    },
  ];

  await prisma.contactInfo.deleteMany({});
  for (const contact of contactInfos) {
    await prisma.contactInfo.create({ data: contact });
  }
  console.log('✅ Seeded contact info');

  // Seed Site Settings
  const siteSettings = [
    {
      key: 'footer',
      value: {
        show_social: true,
        show_contact: true,
        show_newsletter: true,
      },
      description: 'Footer display settings',
    },
    {
      key: 'contact',
      value: {
        email: 'tiemreudecor@gmail.com',
        phone: '0706 668 296',
      },
      description: 'Contact info',
    },
    {
      key: 'social_links',
      value: {
        tiktok: 'https://www.tiktok.com/@tiemreudecor?lang=vi-VN',
        instagram: 'https://www.instagram.com/tiemreudecor/',
        facebook: 'https://www.facebook.com/tiemreudecor',
      },
      description: 'Social media links',
    },
  ];

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }
  console.log('✅ Seeded site settings');

  // Seed Weekly Featured (current week)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  // Check if there's already a weekly featured for this week
  const existingWeekly = await prisma.weeklyFeatured.findFirst({
    where: { weekStart },
  });

  if (!existingWeekly) {
    // Get a random product to feature (if any exists)
    const product = await prisma.product.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (product) {
      await prisma.weeklyFeatured.create({
        data: {
          weekStart,
          productId: product.id,
          reason: 'Sản phẩm đặc biệt của tuần này - được chọn bởi đội ngũ Terrarium Shop',
          isActive: true,
        },
      });
      console.log('✅ Seeded weekly featured');
    } else {
      console.log('⚠️ No products found to seed weekly featured');
    }
  } else {
    console.log('⚠️ Weekly featured already exists for this week');
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
