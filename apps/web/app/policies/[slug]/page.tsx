import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Mock data - replace with DB query
const mockPolicies: Record<string, { title: string; content: string; updatedAt: string }> = {
  warranty: {
    title: 'Chính sách bảo hành',
    content: `
      <h2 class="text-2xl font-bold mb-4">1. Phạm vi bảo hành</h2>
      <p class="mb-4">Tất cả sản phẩm terrarium của chúng tôi được bảo hành trong vòng 30 ngày kể từ ngày mua. Bảo hành áp dụng cho:</p>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>Lỗi sản xuất, chip kính, khung gỗ bị nứt</li>
        <li>Thực vật không phát triển (có thể đổi sản phẩm mới)</li>
        <li)Lỗi thiết kế (lỗi thời gian) – chỉ áp dụng cho các sản phẩm mua trong vòng 7 ngày</li>
      </ul>

      <h2 class="text-2xl font-bold mb-4">2. Điều kiện không được bảo hành</h2>
      <p class="mb-4">Các trường hợp sau không nằm trong chính sách bảo hành:</p>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>Sản phẩm bị hư hỏng do người dùng sử dụng sai cách</li>
        <li>Thực vật chết do không tưới nước/ chăm sóc không đúng</li>
        <li>Người dùng tự ý sửa chữa, thay đổi cấu trúc</li>
      </ul>

      <h2 class="text-2xl font-bold mb-4">3. Quy trình bảo hành</h2>
      <p class="mb-4">Để được bảo hành, khách hàng cần:</p>
      <ol class="list-decimal pl-6 mb-4 space-y-2">
        <li>Liên hệ hotline 0909.xxx.xxx hoặc email support@terrariumshop.vn</li>
        <li>Cung cấp hóa đơn/mã đơn hàng và mô tả lỗi</li>
        <li>Gửi sản phẩm về địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</li>
        <li>Chúng tôi sẽ kiểm tra và phản hồi trong vòng 3-5 ngày làm việc</li>
      </ol>

      <h2 class="text-2xl font-bold mb-4">4. Thời gian xử lý</h2>
      <p class="mb-4">- Bảo hành thay thế: 5-7 ngày làm việc</p>
      <p class="mb-4">- Hoàn tiền: 7-10 ngày làm việc sau khi nhận được sản phẩm</p>
    `,
    updatedAt: '2026-01-15',
  },
  shipping: {
    title: 'Chính sách vận chuyển',
    content: `
      <h2 class="text-2xl font-bold mb-4">1. Phương thức vận chuyển</h2>
      <p class="mb-4">Chúng tôi hợp tác với các đơn vị vận chuyển uy tín:</p>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>Giao Hàng Nhanh (GHN) - tiêu chuẩn và express</li>
        <li>Grab - giao hàng trong 2h (nội thành HCM, HN)</li>
        <li>Viettel Post - cho khu vực miền Tây</li>
      </ul>

      <h2 class="text-2xl font-bold mb-4">2. Thời gian giao hàng</h2>
      <p class="mb-4">- Nội thành TP.HCM: 1-2 ngày làm việc</p>
      <p class="mb-4">- Nội thành Hà Nội: 2-3 ngày làm việc</p>
      <p class="mb-4">- Các tỉnh khác: 3-5 ngày làm việc</p>

      <h2 class="text-2xl font-bold mb-4">3. Chi phí vận chuyển</h2>
      <p class="mb-4">- Miễn phí vận chuyển cho đơn từ 500.000₫</p>
      <p class="mb-4">- Đơn dưới 500.000₫: 30.000₫</p>
      <p class="mb-4">- Giao hàng nhanh (2h): 80.000₫</p>

      <h2 class="text-2xl font-bold mb-4">4. Theo dõi đơn hàng</h2>
      <p class="mb-4">Sau khi đơn hàng được xác nhận, bạn sẽ nhận được mã vận đơn qua email. Sử dụng mã này để theo dõi trên website của đơn vị vận chuyển.</p>
    `,
    updatedAt: '2026-01-10',
  },
  returns: {
    title: 'Chính sách đổi trả',
    content: `
      <h2 class="text-2xl font-bold mb-4">1. Điều kiện đổi trả</h2>
      <p class="mb-4">Bạn có thể đổi/trả sản phẩm trong vòng 7 ngày nếu:</p>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>Sản phẩm bị lỗi, hư hỏng do nhà sản xuất</li>
        <li>Sai mẫu, sai size (nếu sản phẩm có size)</li>
        <li>Sản phẩm không đúng mô tả trên website</li>
      </ul>

      <h2 class="text-2xl font-bold mb-4">2. Không áp dụng đổi trả</h2>
      <p class="mb-4">- Sản phẩm đã qua sử dụng</p>
      <p class="mb-4">- Sản phẩm thiếu phụ kiện, hộp đóng gói</p>
      <p class="mb-4">- Sản phẩm khuyến mãi, giảm giá (trừ khi lỗi)</p>

      <h2 class="text-2xl font-bold mb-4">3. Quy trình đổi trả</h2>
      <ol class="list-decimal pl-6 mb-4 space-y-2">
        <li>Liên hệ hotline hoặc email với mã đơn hàng</li>
        <li>Đóng gói sản phẩm còn nguyên vẹn</li>
        <li>Gửi về địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</li>
        <li>Chúng tôi sẽ gửi sản phẩm mới sau khi nhận được hàng cũ</li>
      </ol>

      <h2 class="text-2xl font-bold mb-4">4. Hoàn tiền</h2>
      <p class="mb-4">Nếu không đổi được sản phẩm khác, bạn có thể yêu cầu hoàn tiền. Thời gian hoàn tiền: 7-10 ngày làm việc sau khi nhận được sản phẩm.</p>
    `,
    updatedAt: '2026-01-05',
  },
  privacy: {
    title: 'Chính sách bảo mật',
    content: `
      <h2 class="text-2xl font-bold mb-4">1. Thông tin thu thập</h2>
      <p class="mb-4">Chúng tôi thu thập các thông tin sau khi bạn đăng ký tài khoản hoặc đặt hàng:</p>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>Họ tên, email, số điện thoại</li>
        <li>Địa chỉ giao hàng</li>
        <li>Thông tin thanh toán (không lưu trữ thẻ)</li>
      </ul>

      <h2 class="text-2xl font-bold mb-4">2. Sử dụng thông tin</h2>
      <p class="mb-4">Thông tin của bạn được sử dụng để:</p>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>Xử lý đơn hàng và giao hàng</li>
        <li>Gửi thông tin khuyến mãi (nếu bạn đồng ý)</li>
        <li>Cải thiện dịch vụ</li>
      </ul>

      <h2 class="text-2xl font-bold mb-4">3. Bảo mật</h2>
      <p class="mb-4">Chúng tôi sử dụng SSL encryption và tuân thủ PCI DSS để bảo vệ thông tin thanh toán. Thông tin cá nhân không được chia sẻ với bên thứ ba trừ khi có sự đồng ý của bạn hoặc yêu cầu pháp luật.</p>
    `,
    updatedAt: '2026-02-01',
  },
  faq: {
    title: 'Câu hỏi thường gặp',
    content: `
      <h2 class="text-2xl font-bold mb-4">Terrarium là gì?</h2>
      <p class="mb-4">Terrarium là một hệ sinh thái thu nhỏ được đựng trong thủy tinh, kết hợp thực vật và các vật dụng trang trí. Chúng tự nhiên và dễ chăm sóc.</p>

      <h2 class="text-2xl font-bold mb-4">Terrarium cần chăm sóc như thế nào?</h2>
      <p class="mb-4">Terrarium của chúng tôi được thiết kế để tự duy trì độ ẩm. Bạn chỉ cần tưới nước nhẹ 1-2 lần/tuần tùy loại. Chi tiết hướng dẫn đi kèm mỗi sản phẩm.</p>

      <h2 class="text-2xl font-bold mb-4">Có thể gửi quà không?</h2>
      <p class="mb-4">Có! Chúng tôi cung cấp dịch vụ gói quà và thiệp viết tay. Bạn có thể thêm ghi chú khi đặt hàng.</p>

      <h2 class="text-2xl font-bold mb-4">Thời gian đặt hàng là bao lâu?</h2>
      <p class="mb-4">Sản phẩm có sẵn: giao trong 1-3 ngày. Sản phẩm order/custom: 5-7 ngày làm việc.</p>

      <h2 class="text-2xl font-bold mb-4">Có hỗ trợ ship quốc tế không?</h2>
      <p class="mb-4">Hiện tại chúng tôi chỉ giao trong Việt Nam. Tuy nhiên, bạn có thể liên hệ để được tư vấn xuất khẩu.</p>
    `,
    updatedAt: '2026-02-10',
  },
};

export default function PolicyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const policy = mockPolicies[params.slug];

  if (!policy) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link href="/policies" className="inline-flex items-center text-sm text-[hsl(220,14%,45%)] hover:text-[#425733] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Link>
      </nav>

      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{policy.title}</h1>
          <div className="flex items-center gap-2 text-sm text-[hsl(220,14%,45%)]">
            <Clock className="w-4 h-4" />
            <span>Cập nhật: {new Date(policy.updatedAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </header>

        <Separator className="mb-8" />

        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:mb-4 prose-ul:mb-4 prose-li:mb-1"
          dangerouslySetInnerHTML={{ __html: policy.content }}
        />
      </article>

      {/* CTA */}
      <div className="mt-12 p-6 bg-[#e3ebdd] rounded-2xl text-center">
        <h3 className="font-bold mb-2">Còn câu hỏi?</h3>
        <p className="text-sm text-[hsl(220,14%,45%)] mb-4">
          Nếu bạn cần thêm thông tin, đừng ngần ngại liên hệ với chúng tôi.
        </p>
        <Button asChild>
          <Link href="/contact">Liên hệ hỗ trợ</Link>
        </Button>
      </div>
    </div>
  );
}
