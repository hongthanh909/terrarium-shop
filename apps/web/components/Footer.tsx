import Link from "next/link";
import { Leaf, Mail, Phone, MapPin, Clock, Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

// Custom TikTok icon — Exception per taste skill Rule 3.C: Lucide doesn't have TikTok
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.28 8.28 0 0 0 4.76 1.5V6.93a4.84 4.84 0 0 1-1-.24z"/>
  </svg>
);

const FALLBACK_SOCIALS = [
  { label: "Instagram", value: "https://www.instagram.com/tiemreudecor/", Icon: Instagram },
  { label: "TikTok", value: "https://www.tiktok.com/@tiemreudecor", Icon: TikTokIcon },
  { label: "Facebook", value: "https://www.facebook.com/tiemreudecor", Icon: Facebook },
];

// Helper function để lấy icon phù hợp
const getIconForSocial = (label: string) => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('facebook')) return Facebook;
  if (lowerLabel.includes('instagram')) return Instagram;
  if (lowerLabel.includes('tiktok')) return TikTokIcon;
  if (lowerLabel.includes('twitter') || lowerLabel.includes('x')) return Twitter;
  return MessageCircle;
};

export default async function Footer() {
  // Hardcoded correct business info — đảm bảo luôn hiển thị đúng bất kể DB
  const emails = [{ value: 'tiemreudecor@gmail.com' }];
  const phones = [{ value: '0706 668 296' }];
  const addresses = [{ value: '32/16 Tam Đa, Phường Long Trường, TP. Hồ Chí Minh' }];
  const workingHours = [{ value: 'Thứ 2 - Chủ nhật: 9:00 - 21:00' }];

  const socials = [
    { label: "TikTok", value: "https://www.tiktok.com/@tiemreudecor?lang=vi-VN", Icon: TikTokIcon },
    { label: "Instagram", value: "https://www.instagram.com/tiemreudecor/", Icon: Instagram },
    { label: "Facebook", value: "https://www.facebook.com/tiemreudecor", Icon: Facebook },
  ];

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
              Terrarium thủ công mang thiên nhiên vào không gian sống của bạn. Mỗi sản phẩm là một hệ sinh thái thu nhỏ, được tạo hình tỉ mỉ.
            </p>
            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              {socials.map((item, idx) => (
                <a
                  key={idx}
                  href={item.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#e3ebdd] hover:bg-[#c8d5be] flex items-center justify-center text-[hsl(220,14%,45%)] hover:text-[#425733] transition-all hover:scale-110 hover:-translate-y-0.5"
                  aria-label={item.label}
                >
                  <item.Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-[hsl(220,14%,25%)] mb-4">Khám phá</h3>
            <ul className="space-y-3 text-sm text-[hsl(220,14%,45%)]">
              <li>
                <Link href="/products" className="relative hover:text-[#425733] transition-colors after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#425733] hover:after:w-full after:transition-all after:duration-300">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/explore" className="relative hover:text-[#425733] transition-colors after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#425733] hover:after:w-full after:transition-all after:duration-300">
                  Được chọn tuần này
                </Link>
              </li>
              <li>
                <Link href="/blog" className="relative hover:text-[#425733] transition-colors after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#425733] hover:after:w-full after:transition-all after:duration-300">
                  Blog & Kiến thức
                </Link>
              </li>
              <li>
                <Link href="/about" className="relative hover:text-[#425733] transition-colors after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#425733] hover:after:w-full after:transition-all after:duration-300">
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-[hsl(220,14%,25%)] mb-4">Liên hệ</h3>
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
                  <a href="mailto:tiemreudecor@gmail.com" className="hover:text-[#425733] transition-colors">
                    tiemreudecor@gmail.com
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
                  <a href="tel:0706668296" className="hover:text-[#425733] transition-colors">0706 668 296</a>
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
                <span>32/16 Tam Đa, Phường Long Trường, TP. Hồ Chí Minh</span>
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
            <h3 className="font-bold text-[hsl(220,14%,25%)] mb-4">Chính sách</h3>
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
            © {new Date().getFullYear()} Tiệm Rêu Décor. All rights reserved.
          </p>
          <p className="text-xs text-[hsl(220,14%,55%)]">
            Crafted with 🌿 in Hồ Chí Minh
          </p>
        </div>
      </div>
    </footer>
  );
}

