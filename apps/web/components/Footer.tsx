"use client";

import Link from "next/link";
import { Leaf, Mail, Phone, MapPin, Clock, Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail,
  Phone,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Twitter,
};

// Helper function để lấy icon phù hợp
const getIconForLabel = (label: string): React.ComponentType<{ className?: string }> => {
  const lowerLabel = label.toLowerCase();

  // Social media icons
  if (lowerLabel.includes('facebook')) return Facebook;
  if (lowerLabel.includes('instagram')) return Instagram;
  if (lowerLabel.includes('tiktok')) return Twitter; // Dùng Twitter tạm, hoặc tạo TikTok icon
  if (lowerLabel.includes('twitter') || lowerLabel.includes('x')) return Twitter;

  // Contact type icons - lấy từ type field thay vì label
  // Sẽ xử lý riêng cho contact items bên dưới
  return MessageCircle; // Default fallback
};

export default function Footer() {
  const [contactData, setContactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contact")
      .then((res) => res.json())
      .then((data) => {
        setContactData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <footer className="bg-gradient-to-b from-[#e3ebdd] to-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 bg-muted rounded w-32" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // New format: array of ContactInfo records
  const contactList = Array.isArray(contactData) ? contactData : [];

  // Extract by type
  const emails = contactList.filter((c: any) => c.type === "email");
  const phones = contactList.filter((c: any) => c.type === "phone");
  const addresses = contactList.filter((c: any) => c.type === "address");
  const workingHours = contactList.filter((c: any) => c.type === "working_hours");
  const socialItems = contactList.filter((c: any) => c.type === "social");

  return (
    <footer className="bg-gradient-to-b from-[#e3ebdd] to-white pt-16 pb-8 border-t border-[#c8d5be]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex flex-col group">
              <span 
                className="text-xl text-[#425733] group-hover:text-[#364a29] transition-colors leading-tight"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
              >
                tiệm Rêu Décor
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-1 h-px bg-[#8ba57a]" />
                <span 
                  className="text-[9px] tracking-wider text-[#5f7d50] whitespace-nowrap"
                  style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 400 }}
                >
                  Terrarium & Moss Art
                </span>
                <div className="w-5 h-px bg-[#8ba57a]" />
              </div>
            </Link>
            <p className="text-[hsl(220,14%,45%)] text-sm leading-relaxed">
              Terrarium thủ công mang thiên nhiên vào không gian sống của bạn. Mỗi sản phẩm là một hệ sinh thái thu nhỏ, được tạo tình tỉ mỉ.
            </p>
            {/* Social Links */}
            {socialItems.length > 0 && (
              <div className="flex gap-3 pt-2">
                {socialItems.map((item: any, idx: number) => {
                  const Icon = getIconForLabel(item.label);
                  return Icon && item.value ? (
                    <a
                      key={idx}
                      href={item.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-[#e3ebdd] hover:bg-[#c8d5be] flex items-center justify-center text-[hsl(220,14%,45%)] hover:text-[#425733] transition-all"
                      aria-label={item.label}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-[hsl(220,14%,25%)] mb-4">Khám phá</h4>
            <ul className="space-y-3 text-sm text-[hsl(220,14%,45%)]">
              <li>
                <Link href="/products" className="hover:text-[#425733] transition-colors">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-[#425733] transition-colors">
                  Được chọn tuần này
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#425733] transition-colors">
                  Blog & Kiến thức
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#425733] transition-colors">
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-[hsl(220,14%,25%)] mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm text-[hsl(220,14%,45%)]">
              {emails.length > 0 ? (
                emails.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#425733]" />
                    <a href={`mailto:${item.value}`} className="hover:text-[#425733] transition-colors">
                      {item.value}
                    </a>
                  </li>
                ))
              ) : (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#425733]" />
                  <a href="mailto:hello@tiemreudecor.vn" className="hover:text-[#425733] transition-colors">
                    hello@tiemreudecor.vn
                  </a>
                </li>
              )}
              {phones.length > 0 ? (
                phones.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#425733]" />
                    <span>{item.value}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#425733]" />
                  <span>Liên hệ qua trang Liên Hệ</span>
                </li>
              )}
              {addresses.length > 0 ? (
                addresses.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#425733] mt-0.5" />
                    <span>{item.value}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#425733] mt-0.5" />
                  <span>TP. Hồ Chí Minh</span>
                </li>
              )}
              {workingHours.length > 0 ? (
                workingHours.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#425733]" />
                    <span>{item.value}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#425733]" />
                  <span>Thứ 2 - Chủ nhật: 9:00 - 21:00</span>
                </li>
              )}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-bold text-[hsl(220,14%,25%)] mb-4">Chính sách</h4>
            <ul className="space-y-3 text-sm text-[hsl(220,14%,45%)]">
              <li>
                <Link href="/policies/warranty" className="hover:text-[#425733] transition-colors">
                  Bảo hành
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" className="hover:text-[#425733] transition-colors">
                  Vận chuyển
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-[#425733] transition-colors">
                  Đổi trả
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-[#425733] transition-colors">
                  Bảo mật
                </Link>
              </li>
              <li>
                <Link href="/policies/faq" className="hover:text-[#425733] transition-colors">
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[#c8d5be] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[hsl(220,14%,45%)]">
            © {new Date().getFullYear()} Tiệm Rêu decor. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[hsl(220,14%,45%)]">Theo dõi chúng tôi:</span>
            <div className="flex gap-2">
              {socialItems.map((item: any, idx: number) => {
                const Icon = iconMap[item.label];
                return Icon && item.value ? (
                  <a
                    key={idx}
                    href={item.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-[#e3ebdd] hover:bg-[#425733] hover:text-white flex items-center justify-center transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
