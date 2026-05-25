import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Leaf, Truck, ArrowRight, Star, Sparkles, Shield, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Terrarium Shop | Mang Thiên Nhiên Vào Trong Nhà",
  description: "Khám phá bộ sưu tập terrarium thủ công của chúng tôi — những hệ sinh thái thu nhỏ biến không gian của bạn thành thiên nhiên trong trẻo.",
  openGraph: {
    title: "Terrarium Shop | Khám Phá Hệ Sinh Thái Của Bạn",
    description: "Cung cấp các sản phẩm terrarium thủ công, thiết kế độc bản.",
    type: "website",
    locale: "vi_VN",
  },
};

export default async function Home() {
  // Fetch Data directly on Server
  const [featuredProducts, latestPosts, topReviews] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true, status: "ACTIVE" },
      take: 4,
      include: { category: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: { category: true },
    }),
    prisma.review.findMany({
      where: { approved: true, rating: 5 },
      take: 3,
      include: { customer: true },
    }),
  ]);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#e3ebdd] via-[#c8d5be] to-[#6d8c5a] text-[hsl(220,14%,25%)] min-h-[85vh] flex items-center">
        {/* Soft decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[rgba(66,87,51,0.15)] rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[rgba(66,87,51,0.15)] rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-[rgba(66,87,51,0.1)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center w-full">
          <ScrollReveal direction="down" delay={0.1}>
            <Badge className="mb-6 bg-[#425733] text-[#ffffff] border-2 border-[#425733]/30 hover:bg-[#4d6b3d] backdrop-blur-sm px-4 py-1.5 text-sm font-medium inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Hệ Sinh Thái Thu Nhỏ Độc Bản
            </Badge>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
              Mang Thiên Nhiên{" "}
              <span className="text-[#425733]">
                Vào Trong Nhà
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3}>
            <p className="text-xl md:text-2xl mb-10 text-[hsl(220,14%,45%)] max-w-2xl mx-auto leading-relaxed">
              Khám phá bộ sưu tập terrarium thủ công của chúng tôi — những hệ sinh thái thu nhỏ biến không gian của bạn thành thiên nhiên trong trẻo.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-[#425733] text-[#ffffff] hover:bg-[#4d6b3d] font-bold text-base px-8 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-0.5"
                asChild
              >
                <Link href="/products">
                  Mua Ngay
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#425733]/30 text-[hsl(220,14%,25%)] hover:bg-[#e3ebdd] font-bold text-base px-8 transition-all duration-300"
                asChild
              >
                <Link href="#about">Tìm Hiểu Thêm</Link>
              </Button>
            </div>
          </ScrollReveal>

          {/* Stats bar */}
          <ScrollReveal direction="up" delay={0.5}>
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              {[
                { number: "500+", label: "Khách hàng hài lòng" },
                { number: "50+", label: "Thiết kế độc bản" },
                { number: "4.9★", label: "Đánh giá trung bình" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-[#364a29]">{stat.number}</div>
                  <div className="text-sm text-[hsl(220,14%,55%)] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-[#f0f4ec]">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-3">Tại Sao Chọn Chúng Tôi</p>
              <h2 className="text-4xl font-bold text-[hsl(220,14%,25%)]">Tất Cả Bạn Cần</h2>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Leaf className="w-8 h-8" />,
                title: "Thân Thiện Môi Trường",
                desc: "Vật liệu được tìm nguồn bền vững và cây trồng được chọn lọc từ vườn ươm địa phương.",
                color: "text-[#425733]",
                bg: "bg-[#e3ebdd]",
              },
              {
                icon: <Truck className="w-8 h-8" />,
                title: "Vận Chuyển An Toàn",
                desc: "Đảm bảo giao hàng tận nơi với lớp chống sốc đặc biệt, cây xanh luôn tươi tốt.",
                color: "text-[hsl(210,50%,50%)]",
                bg: "bg-[hsl(210,50%,94%)]",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Bảo Hành Cây Sống",
                desc: "Hỗ trợ thay cây miễn phí trong 30 ngày nếu terrarium của bạn không phát triển.",
                color: "text-[hsl(260,40%,55%)]",
                bg: "bg-[hsl(260,40%,94%)]",
              },
            ].map((item, index) => (
              <ScrollReveal key={item.title} direction="up" delay={index * 0.15}>
                <Card className="border-0 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 group cursor-default overflow-hidden h-full">
                  <CardContent className="p-8 h-full flex flex-col">
                    <div className={`w-16 h-16 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-[hsl(220,14%,25%)]">{item.title}</h3>
                    <p className="text-[hsl(220,14%,45%)] leading-relaxed flex-1">{item.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
              <div>
                <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-3">Được Lựa Chọn Cho Bạn</p>
                <h2 className="text-4xl font-bold text-[hsl(220,14%,25%)]">Sản Phẩm Nổi Bật</h2>
              </div>
              <Button variant="outline" asChild className="self-start md:self-auto border-2 border-[#6d8c5a] text-[#425733] hover:bg-[#e3ebdd]">
                <Link href="/products" className="group">
                  Xem Tất Cả
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>

          {featuredProducts.length === 0 ? (
            <ScrollReveal direction="up">
              <div className="text-center py-24 bg-[#f0f4ec] rounded-3xl">
                <Leaf className="w-16 h-16 mx-auto text-[#5a7a48] mb-4" />
                <p className="text-[hsl(220,14%,45%)] font-semibold text-lg mb-1">Chưa có sản phẩm nổi bật</p>
                <p className="text-sm text-[hsl(220,14%,55%)]">Hãy quay lại sau nhé.</p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product: any, index: number) => (
                <ScrollReveal key={product.id} direction="up" delay={index * 0.1} className="h-full">
                  <Link href={`/products/${product.slug}`} className="block h-full">
                    <Card className="overflow-hidden hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 group border-0 rounded-2xl h-full flex flex-col">
                      <CardContent className="p-0 flex flex-col h-full">
                        <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                          {product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#e3ebdd] to-[#f0f4ec] flex items-center justify-center">
                              <Leaf className="w-16 h-16 text-[#6d8c5a]" />
                            </div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <Badge variant="secondary" className="text-xs w-fit mb-3 font-semibold bg-[#e3ebdd] text-[#425733]">
                            {product.category.name}
                          </Badge>
                          <h3 className="font-bold text-[hsl(220,14%,25%)] mb-1 group-hover:text-[#425733] transition-colors line-clamp-2 min-h-[3rem]">
                            {product.name}
                          </h3>
                          <p className="text-xl font-bold text-[#425733] mt-auto pt-2">
                            {Number(product.basePrice.toString()).toLocaleString("vi-VN")}₫
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonial / Social Proof */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#e3ebdd] to-[#cdd8c2]">
        <div className="max-w-7xl mx-auto text-center">
          <ScrollReveal direction="up">
            <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-4">Khách Hàng Nói Gì</p>
            <h2 className="text-4xl font-bold mb-12 text-[hsl(220,14%,25%)]">Lời Đánh Giá</h2>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {topReviews.length > 0 ? (
              topReviews.map((t: any, index: number) => (
                <ScrollReveal key={t.id} direction="up" delay={index * 0.1}>
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 text-left shadow-soft hover:shadow-soft-lg transition-all duration-300 h-full flex flex-col">
                    <div className="flex gap-1.5 mb-5">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {t.title && <h4 className="font-bold text-gray-800 mb-2">{t.title}</h4>}
                    <p className="text-[hsl(220,14%,45%)] leading-relaxed mb-5 text-base italic flex-1">"{t.content}"</p>
                    <div className="flex items-center gap-4 mt-auto">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6d8c5a] to-[#425733] flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {t.customer.name?.[0] || "C"}
                      </div>
                      <span className="font-bold text-[hsl(220,14%,25%)]">{t.customer.name || "Khách Hàng"}</span>
                    </div>
                  </div>
                </ScrollReveal>
              ))
            ) : (
              // Fallback if no dynamic reviews exist yet
              [
                { name: "Minh Anh", review: "Tuyệt vời! Terrarium làm góc làm việc của mình xanh tươi hẳn lên.", rating: 5 },
                { name: "Thu Hằng", review: "Sản phẩm đóng gói cực kỳ cẩn thận. Cây xanh tươi tốt như hình.", rating: 5 },
                { name: "Bảo Long", review: "Dịch vụ quá đỉnh. Mua về bị héo 1 cây nhỏ là shop đổi liền cho cây mới.", rating: 5 },
              ].map((t: any, index: number) => (
                <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 text-left shadow-soft hover:shadow-soft-lg transition-all duration-300 h-full flex flex-col">
                    <div className="flex gap-1.5 mb-5">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-[hsl(220,14%,45%)] leading-relaxed mb-5 text-base italic flex-1">"{t.review}"</p>
                    <div className="flex items-center gap-4 mt-auto">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6d8c5a] to-[#425733] flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {t.name[0]}
                      </div>
                      <span className="font-bold text-[hsl(220,14%,25%)]">{t.name}</span>
                    </div>
                  </div>
                </ScrollReveal>
              ))
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-gradient-to-br from-[#f0f4ec] to-[#e3ebdd]">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#a8c098] mb-6">
              <Leaf className="w-8 h-8 text-[#425733]" />
            </div>
            <h2 className="text-4xl font-bold mb-6 text-[hsl(220,14%,25%)]">Về Sản Phẩm Của Chúng Tôi</h2>
            <p className="text-lg text-[hsl(220,14%,45%)] mb-6 leading-relaxed">
              Mỗi terrarium được tạo hình tỉ mỉ, kết hợp thiết kế thủy tinh đẹp mắt
              với hệ thực vật được chọn lọc để tạo nên một hệ sinh thái tự duy trì.
              Hoàn hảo cho mọi không gian, mang lại sự hiện diện thanh tao của thiên nhiên
              ngay tại bàn làm việc hoặc phòng khách của bạn.
            </p>
            <p className="text-lg text-[hsl(220,14%,45%)] leading-relaxed">
              Dù bạn là người yêu thích sự tĩnh lặng hay đang tìm kiếm một món quà độc đáo,
              sản phẩm của chúng tôi luôn là lựa chọn hoàn hảo.
            </p>
            <Button size="lg" className="mt-10 bg-[#425733] text-white hover:bg-[#364a29] px-8 font-semibold shadow-soft-lg" asChild>
              <Link href="/products">
                Khám Phá Cửa Hàng
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
              <div>
                <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-3">Bài Viết Mới Nhất</p>
                <h2 className="text-4xl font-bold text-[hsl(220,14%,25%)]">Góc Chia Sẻ</h2>
              </div>
              <Button variant="outline" asChild className="self-start md:self-auto border-2 border-[#6d8c5a] text-[#425733] hover:bg-[#e3ebdd]">
                <Link href="/blog" className="group">
                  Xem Tất Cả Bài Viết
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>

          {latestPosts.length === 0 ? (
            <ScrollReveal direction="up">
              <div className="text-center py-24 bg-[#f0f4ec] rounded-3xl">
                <FileText className="w-16 h-16 mx-auto text-[#5a7a48] mb-4" />
                <p className="text-[hsl(220,14%,45%)] font-semibold text-lg mb-1">Chưa có bài viết nào</p>
                <p className="text-sm text-[hsl(220,14%,55%)]">Hãy quay lại sau để xem mẹo và hướng dẫn chăm sóc nhé!</p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestPosts.map((post: any, index: number) => {
                // Fallback elegant thumbnails since DB doesn't have blog images
                const fallbackImages = [
                  "https://images.unsplash.com/photo-1595086862145-2be916325514?w=800&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1416879598056-cb6f64d0a3d4?w=800&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=800&auto=format&fit=crop&q=80"
                ];
                const thumbnail = fallbackImages[index % 3];

                return (
                  <ScrollReveal key={post.id} direction="up" delay={index * 0.1} className="h-full">
                    <Link href={`/blog/${post.slug}`} className="block h-full">
                      <Card className="overflow-hidden hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 group border-0 rounded-2xl h-full flex flex-col">
                        <CardContent className="p-0 flex flex-col h-full">
                          <div className="aspect-video relative overflow-hidden bg-[#f0f4ec]">
                            <Image
                              src={thumbnail}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                            {post.category && (
                              <Badge variant="secondary" className="text-xs mb-3 w-fit bg-[#e3ebdd] text-[#425733]">
                                {post.category.name}
                              </Badge>
                            )}
                            <h3 className="font-bold text-xl text-[hsl(220,14%,25%)] mb-3 line-clamp-2 group-hover:text-[#425733] transition-colors min-h-[3.5rem]">
                              {post.title}
                            </h3>
                            <p className="text-sm text-[hsl(220,14%,45%)] line-clamp-3 mb-4 flex-1">
                              {post.content.replace(/<[^>]*>/g, '').slice(0, 150)}...
                            </p>
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#6d8c5a] uppercase tracking-wider">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : "Mới đây"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </ScrollReveal>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#425733] to-[#364a29] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up">
            <h2 className="text-4xl font-bold mb-6">Sẵn Sàng Mang Cả Khu Rừng Về Nhà?</h2>
            <p className="text-xl mb-10 text-white/90 leading-relaxed max-w-2xl mx-auto">
              Chỉ với vài cú click, bạn đã có ngay một hệ sinh thái thu nhỏ tự duy trì, mang lại năng lượng tích cực cho không gian sống.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-[#425733] hover:bg-[#f0f4ec] font-bold text-base px-8 shadow-soft-lg hover:-translate-y-1 transition-all duration-300"
                asChild
              >
                <Link href="/products">
                  Mua Ngay
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/50 bg-transparent text-white hover:bg-white/10 hover:border-white font-bold text-base px-8 hover:-translate-y-1 transition-all duration-300"
                asChild
              >
                <Link href="/consult">Nhận Tư Vấn Cây Trồng</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
