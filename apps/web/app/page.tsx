"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Leaf, Truck, ArrowRight, Star, Sparkles, Shield, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  slug: string;
  name: string;
  basePrice: {
    toString: () => string;
  };
  images: string[];
  category: {
    name: string;
  };
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  publishedAt: string;
  category?: {
    name: string;
  };
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, blogRes] = await Promise.all([
          fetch("/api/products?featured=true&limit=4"),
          fetch("/api/blog?limit=3"),
        ]);

        const [productsData, blogData] = await Promise.all([
          productsRes.json(),
          blogRes.json(),
        ]);

        setFeaturedProducts(productsData.products || productsData || []);
        setLatestPosts(blogData.posts || blogData || []);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#e3ebdd] via-[#c8d5be] to-[#6d8c5a] text-[hsl(220,14%,25%)] min-h-[85vh] flex items-center">
        {/* Soft decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[rgba(66,87,51,0.15)] rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[rgba(66,87,51,0.15)] rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-[rgba(66,87,51,0.1)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center w-full">
          <Badge className="mb-6 bg-[#425733] text-[#ffffff] border-2 border-[#425733]/30 hover:bg-[#4d6b3d] backdrop-blur-sm px-4 py-1.5 text-sm font-medium inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Hệ Sinh Thái Thu Nhỏ Được Tạo Tình
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            Mang Thiên Nhiên{" "}
            <span className="text-[#425733]">
              Vào Trong Nhà
            </span>
          </h1>

          <p className="text-xl md:text-2xl mb-10 text-[hsl(220,14%,45%)] max-w-2xl mx-auto leading-relaxed">
            Khám phá bộ sưu tập terrarium thủ công của chúng tôi — những hệ sinh thái thu nhỏ biến không gian của bạn thành thiên nhiên trong trẻo.
          </p>

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

          {/* Stats bar */}
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
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-[#f0f4ec]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-3">Tại Sao Chọn Chúng Tôi</p>
            <h2 className="text-4xl font-bold text-[hsl(220,14%,25%)]">Tất Cả Bạn Cần</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Leaf className="w-8 h-8" />,
                title: "Thân Thiện Môi Trường",
                desc: "Vật liệu được tìm nguồn bền vững và cây trồng được chọn lọc từ vườn ươm địa phương",
                color: "text-[#425733]",
                bg: "bg-[#e3ebdd]",
              },
              {
                icon: <Truck className="w-8 h-8" />,
                title: "Miễn Phí Vận Chuyển",
                desc: "Giao hàng miễn phí cho đơn từ 500,000₫ trong Việt Nam",
                color: "text-[hsl(210,50%,50%)]",
                bg: "bg-[hsl(210,50%,94%)]",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Bảo Đảm Chất Lượng",
                desc: "30 ngày hài lòng — nếu terrarium không phát triển, chúng tôi sẽ khắc phục",
                color: "text-[hsl(260,40%,55%)]",
                bg: "bg-[hsl(260,40%,94%)]",
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="border-0 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 group cursor-default overflow-hidden"
              >
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[hsl(220,14%,25%)]">{item.title}</h3>
                  <p className="text-[hsl(220,14%,45%)] leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sản Phẩm Nổi Bật Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-3">Được Lựa Chọn Cho Bạn</p>
              <h2 className="text-4xl font-bold text-[hsl(220,14%,25%)]">Sản Phẩm Nổi Bật</h2>
            </div>
            <Button variant="outline" asChild className="self-start md:self-auto">
              <Link href="/products" className="group">
                Xem Tất Cả
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-[#f0f4ec]" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-[#e3ebdd] rounded w-1/3" />
                    <div className="h-4 bg-[#e3ebdd] rounded w-2/3" />
                    <div className="h-4 bg-[#e3ebdd] rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-24 bg-[#f0f4ec] rounded-3xl">
              <Leaf className="w-16 h-16 mx-auto text-[#5a7a48] mb-4" />
              <p className="text-[hsl(220,14%,45%)] font-semibold text-lg mb-1">No featured products yet</p>
              <p className="text-sm text-[hsl(220,14%,55%)]">Visit the admin panel to add products.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Card className="overflow-hidden hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 group border-0 rounded-2xl">
                    <CardContent className="p-0">
                      <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                        {product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#e3ebdd] to-[#f0f4ec] flex items-center justify-center">
                            <Leaf className="w-16 h-16 text-[#6d8c5a]" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <Badge variant="secondary" className="text-xs mb-3 font-semibold bg-[#e3ebdd] text-[#425733]">
                          {product.category.name}
                        </Badge>
                        <h3 className="font-bold text-[hsl(220,14%,25%)] mb-1 group-hover:text-[#425733] transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-xl font-bold text-[#425733] mt-2">
                          {Number(product.basePrice.toString()).toLocaleString("vi-VN")}₭
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonial / Social Proof */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#e3ebdd] to-[#cdd8c2]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-4">Khách Hàng Nói Gì</p>
          <h2 className="text-4xl font-bold mb-12 text-[hsl(220,14%,25%)]">Lời Đánh Giá</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Minh Anh",
                review: "The terrarium is absolutely stunning! It's brought so much life to my desk. The quality is exceptional.",
                rating: 5,
              },
              {
                name: "Thu Hang",
                review: "Perfect gift for my mom. Packaged beautifully and arrived in perfect condition. Will order again!",
                rating: 5,
              },
              {
                name: "Bao Long",
                review: "I've bought 3 terrariums now. Each one is unique and the plants stay healthy with the care guide included.",
                rating: 5,
              },
            ].map((t) => (
              <div key={t.name} className="bg-white backdrop-blur-sm rounded-2xl p-8 text-left shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <div className="flex gap-1.5 mb-5">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[hsl(220,14%,45%)] leading-relaxed mb-5 text-base">"{t.review}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6d8c5a] to-[#425733] flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <span className="font-bold text-[hsl(220,14%,25%)]">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-gradient-to-br from-[#f0f4ec] to-[#e3ebdd]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#a8c098] mb-6">
            <Leaf className="w-8 h-8 text-[#425733]" />
          </div>
          <h2 className="text-4xl font-bold mb-6 text-[hsl(220,14%,25%)]">Về Sản Phẩm Của Rêu</h2>
          <p className="text-lg text-[hsl(220,14%,45%)] mb-6 leading-relaxed">
            Mỗi terrarium được tạo tình tỉ mỉ, kết hợp thiết kế thủy tinh đẹp mắt
            với cây trồng được chọn lọc tạo nên hệ sinh thái tự duy trì.
            Hoàn hảo cho mọi không gian, terrarium mang lại sự hiện diện của thiên nhiên
            ngay tại bàn làm việc hoặc kệ của bạn.
          </p>
          <p className="text-lg text-[hsl(220,14%,45%)] leading-relaxed">
            Dù bạn là người yêu thích cây xanh hay tìm kiếm món quà độc đáo,
            terrarium của chúng tôi là lựa chọn hoàn hảo.
          </p>
          <Button size="lg" className="mt-10 px-8 font-semibold shadow-soft-lg" asChild>
            <Link href="/products">
              Khám Phá Bộ Sưu Tập
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <p className="text-[#425733] font-bold text-sm uppercase tracking-wide mb-3">Bài Viết Mới Nhất</p>
              <h2 className="text-4xl font-bold text-[hsl(220,14%,25%)]">Từ Blog Của Chúng Tôi</h2>
            </div>
            <Button variant="outline" asChild className="self-start md:self-auto">
              <Link href="/blog" className="group">
                Xem Tất Cả Bài Viết
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-video bg-[#f0f4ec]" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-[#e3ebdd] rounded w-1/3" />
                    <div className="h-4 bg-[#e3ebdd] rounded w-3/4" />
                    <div className="h-3 bg-[#e3ebdd] rounded w-full" />
                    <div className="h-3 bg-[#e3ebdd] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : latestPosts.length === 0 ? (
            <div className="text-center py-24 bg-[#f0f4ec] rounded-3xl">
              <FileText className="w-16 h-16 mx-auto text-[#5a7a48] mb-4" />
              <p className="text-[hsl(220,14%,45%)] font-semibold text-lg mb-1">Chưa có bài viết nào</p>
              <p className="text-sm text-[hsl(220,14%,55%)]">Hãy quay lại sau để xem mẹo và hướng dẫn!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="overflow-hidden hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 group border-0 rounded-2xl h-full flex flex-col">
                    <CardContent className="p-0 flex-1 flex flex-col">
                      <div className="aspect-video bg-[#f0f4ec] flex items-center justify-center relative overflow-hidden">
                        <FileText className="w-16 h-16 text-[#5a7a48]" />
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        {post.category && (
                          <Badge variant="secondary" className="text-xs mb-3 w-fit bg-[#e3ebdd] text-[#425733]">
                            {post.category.name}
                          </Badge>
                        )}
                        <h3 className="font-bold text-[hsl(220,14%,25%)] mb-3 line-clamp-2 group-hover:text-[#425733] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-[hsl(220,14%,45%)] line-clamp-3 mb-4 flex-1">
                          {post.content.replace(/<[^>]*>/g, '').slice(0, 150)}...
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[hsl(220,14%,55%)]">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#425733] to-[#364a29] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Sẵn Sàng Mang Thiên Nhiên Vào Nhà?</h2>
          <p className="text-xl mb-10 text-white/90 leading-relaxed">
            Khám phá bộ sưu tập terrarium thủ công của chúng tôi và tìm kiếm người bạn xanh hoàn hảo cho không gian của bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-[#425733] hover:bg-white/90 font-bold text-base px-8 shadow-soft-lg"
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
              className="border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white font-bold text-base px-8"
              asChild
            >
              <Link href="/consult">Nhận Tư Vấn Miễn Phí</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
