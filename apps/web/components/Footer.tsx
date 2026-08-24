import Link from "next/link";
import { Mail, MapPin, Clock, Facebook, Instagram } from "lucide-react";

// Custom TikTok icon — Exception per taste skill Rule 3.C: Lucide doesn't have TikTok
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.28 8.28 0 0 0 4.76 1.5V6.93a4.84 4.84 0 0 1-1-.24z"/>
  </svg>
);

export default async function Footer() {
  // Hardcoded correct business info — đảm bảo luôn hiển thị đúng bất kể DB
  const emails = [{ value: 'tiemreudecor@gmail.com' }];
  const fanpages = [{ label: 'tiemreudecor', value: 'https://www.facebook.com/tiemreudecor' }];
  const addresses = [{ value: 'Long Trường, Hồ Chí Minh' }];
  const workingHours = [{ value: 'Thứ 2 - Chủ nhật: 9:00 - 21:00' }];

  const socials = [
    { label: "Instagram", value: "https://www.instagram.com/tiemreudecor/", Icon: Instagram },
    { label: "Facebook", value: "https://www.facebook.com/tiemreudecor", Icon: Facebook },
    { label: "TikTok", value: "https://www.tiktok.com/@tiemreudecor", Icon: TikTokIcon },
  ];

  return (
    <footer className="border-t border-border bg-white pb-8 pt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex flex-col group">
              <span 
                className="text-xl leading-tight text-foreground transition-colors group-hover:text-foreground/75"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
              >
                tiệm Rêu Décor
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-px flex-1 bg-border" />
                <span 
                  className="whitespace-nowrap text-[9px] text-muted-foreground"
                  style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 400 }}
                >
                  Terrarium & Moss Art
                </span>
                <div className="h-px w-5 bg-border" />
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
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
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-white text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={item.label}
                >
                  <item.Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-bold text-foreground">Khám phá</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="transition-colors hover:text-foreground">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/explore" className="transition-colors hover:text-foreground">
                  Được chọn tuần này
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-foreground">
                  Blog & Kiến thức
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-foreground">
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-bold text-foreground">Liên hệ</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {emails.length > 0 ? (
                emails.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-foreground" />
                    <a href={`mailto:${item.value}`} className="transition-colors hover:text-foreground">
                      {item.value}
                    </a>
                  </li>
                ))
              ) : (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-foreground" />
                  <a href="mailto:tiemreudecor@gmail.com" className="transition-colors hover:text-foreground">
                    tiemreudecor@gmail.com
                  </a>
                </li>
              )}
              {fanpages.length > 0 ? (
                fanpages.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-foreground" />
                    <a href={item.value} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
                      Fanpage: {item.label}
                    </a>
                  </li>
                ))
              ) : (
                <li className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-foreground" />
                  <a href="https://www.facebook.com/tiemreudecor" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
                    Fanpage: tiemreudecor
                  </a>
                </li>
              )}
              {addresses.length > 0 ? (
                addresses.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-foreground" />
                    <span>{item.value}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-foreground" />
                  <span>Long Trường, Hồ Chí Minh</span>
                </li>
              )}
              {workingHours.length > 0 ? (
                workingHours.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-foreground" />
                    <span>{item.value}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-foreground" />
                  <span>Thứ 2 - Chủ nhật: 9:00 - 21:00</span>
                </li>
              )}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="mb-4 font-bold text-foreground">Chính sách</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/policies/warranty" className="transition-colors hover:text-foreground">
                  Bảo hành
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" className="transition-colors hover:text-foreground">
                  Vận chuyển
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="transition-colors hover:text-foreground">
                  Đổi trả
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="transition-colors hover:text-foreground">
                  Bảo mật
                </Link>
              </li>
              <li>
                <Link href="/policies/faq" className="transition-colors hover:text-foreground">
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tiệm Rêu Décor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

