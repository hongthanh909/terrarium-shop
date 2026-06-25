"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Star, Leaf, ShoppingBag, Sprout, Trophy
} from "lucide-react";
import { NumberTicker } from "./number-ticker";

// 6 reviews matching the requested Vietnamese contents
const reviews = [
  {
    name: "Phạm Thu Hà",
    product: "Bộ Quà Tặng Terrarium",
    rating: 5,
    location: "Hà Nội",
    text: "Mua làm quà tặng sinh nhật bạn, được khen không ngớt. Thiết kế tinh tế, rất đáng tiền.",
    avatarBg: "from-[#daebd0] to-[#a8c098]",
    initials: "TH",
    isGreenBg: true,
    tiltClass: "md:-rotate-1"
  },
  {
    name: "Trần Minh Khoa",
    product: "Terrarium Cactus",
    rating: 5,
    location: "Hồ Chí Minh",
    text: "Shop tư vấn rất nhiệt tình, giao hàng nhanh. Terrarium đặt bàn làm việc trông sang lắm.",
    avatarBg: "from-[#a8c098] to-[#8fa87f]",
    initials: "MK",
    isGreenBg: false,
    tiltClass: "md:rotate-1"
  },
  {
    name: "Lê Văn Hùng",
    product: "Terrarium Rêu Biển",
    rating: 5,
    location: "Đà Nẵng",
    text: "Chất lượng tuyệt vời, nhân viên support nhiệt tình. Terrarium vẫn xanh tốt sau 3 tháng!",
    avatarBg: "from-[#8fa87f] to-[#6d8c5a]",
    initials: "VH",
    isGreenBg: true,
    tiltClass: "md:-rotate-1"
  },
  {
    name: "Nguyễn Thị Lan",
    product: "Terrarium Rêu Suối",
    rating: 5,
    location: "Nha Trang",
    text: "Terrarium đẹp hơn hình rất nhiều! Cây rất khỏe, đóng gói cẩn thận. Sẽ mua lại!",
    avatarBg: "from-[#e3ebdd] to-[#a8c098]",
    initials: "TL",
    isGreenBg: false,
    tiltClass: "md:rotate-1"
  },
  {
    name: "Nguyễn Hoàng Nam",
    product: "Terrarium Hệ Kín",
    rating: 5,
    location: "Hải Phòng",
    text: "Terrarium hệ kín rất dễ chăm sóc, đúng như quảng cáo. Trợ lý AI Tiệm Rêu hướng dẫn rất chi tiết.",
    avatarBg: "from-[#6d8c5a] to-[#425733]",
    initials: "HN",
    isGreenBg: true,
    tiltClass: "md:-rotate-0.5"
  },
  {
    name: "Đỗ Thuỳ Chi",
    product: "Moss Art Để Bàn",
    rating: 5,
    location: "Cần Thơ",
    text: "Bể rêu đẹp lung linh, đóng gói cẩn thận không sứt mẻ gì. Rất thích chính sách bảo hành thực vật của shop.",
    avatarBg: "from-[#edf3ea] to-[#daebd0]",
    initials: "TC",
    isGreenBg: false,
    tiltClass: "md:rotate-0.5"
  }
];

function ReviewCard({ rev }: { rev: typeof reviews[0] }) {
  return (
    <div
      className={`group rounded-2xl p-4 md:p-5 border transition-all duration-300 flex items-start gap-4 cursor-default opacity-90 hover:opacity-100 shadow-[0_8px_30px_rgba(41,58,32,0.04)] hover:shadow-[0_20px_45px_rgba(41,58,32,0.15)] hover:scale-[1.03] hover:-translate-y-1 hover:rotate-0 ${
        rev.isGreenBg 
          ? "bg-[#e8efe2]/90 border-[#daebd0] hover:bg-[#d5e0cd] hover:border-[#425733]" 
          : "bg-white/90 border-[#daebd0] hover:bg-[#fafbf9] hover:border-[#425733]"
      } ${rev.tiltClass}`}
    >
      {/* Left Column: Avatar */}
      <div className={`w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr ${rev.avatarBg} flex items-center justify-center text-white text-sm font-extrabold shadow-inner flex-shrink-0`}>
        {rev.initials}
      </div>

      {/* Right Column: Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div>
            <h4 className="font-bold text-gray-800 text-xs md:text-sm truncate group-hover:text-black transition-colors duration-300">
              {rev.name}
            </h4>
            <span className="text-[10px] text-gray-400 font-semibold block mt-0.5 group-hover:text-gray-500 transition-colors duration-300">
              {rev.location} · Đã mua
            </span>
          </div>
          
          {/* Star Rating on the Right */}
          <div className="flex gap-0.5 flex-shrink-0">
            {Array.from({ length: rev.rating }).map((_, s) => (
              <Star key={s} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-semibold group-hover:text-gray-900 group-hover:font-extrabold transition-all duration-300">
          &ldquo;{rev.text}&rdquo;
        </p>
      </div>
    </div>
  );
}

export function ReviewMarquee({ className }: { className?: string }) {
  // Sliced reviews for the custom surrounding layout
  const leftReviews = [reviews[0], reviews[1]];
  const rightReviews = [reviews[3], reviews[5]];
  const topReview = reviews[4];
  const bottomReview = reviews[2];

  // Interactive phone states
  const [isNotificationOn, setIsNotificationOn] = useState(true);
  const [isOpenStatus, setIsOpenStatus] = useState(true);
  const [isDashboardActive, setIsDashboardActive] = useState(false);

  return (
    <section className={`py-24 px-6 bg-gradient-to-br from-[#fafbf8] to-[#edf3ea] overflow-hidden relative ${className || ""}`}>
      {/* Decorative leaf shapes in background */}
      <div className="absolute top-10 left-10 text-[#425733]/5 pointer-events-none select-none">
        <Leaf size={140} className="rotate-45" />
      </div>
      <div className="absolute bottom-10 right-10 text-[#425733]/5 pointer-events-none select-none">
        <Leaf size={140} className="-rotate-12" />
      </div>
 
      {/* Decorative Dot Patterns */}
      <div className="absolute top-12 right-12 w-16 h-16 opacity-20 hidden lg:block" style={{ backgroundImage: "radial-gradient(#425733 2px, transparent 0)", backgroundSize: "8px 8px" }} />
      <div className="absolute bottom-12 left-12 w-16 h-16 opacity-20 hidden lg:block" style={{ backgroundImage: "radial-gradient(#425733 2px, transparent 0)", backgroundSize: "8px 8px" }} />
 
      <div className="max-w-7xl mx-auto">
        {/* Centered section header with underline */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold pb-4 relative inline-block" style={{ background: 'linear-gradient(135deg, #1a2e12, #425733)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Feedback từ khách hàng đến Rêu
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-1 bg-gradient-to-r from-[#6d8c5a] to-[#425733] rounded-full shadow-sm" />
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: 2 Reviews (col-span-3) */}
          <div className="col-span-12 lg:col-span-3 order-2 lg:order-1">
            <div className="space-y-6 relative z-10 max-w-xl mx-auto lg:mx-0">
              {leftReviews.map((rev, index) => (
                <ReviewCard key={index} rev={rev} />
              ))}
            </div>
          </div>

          {/* Center Column: Phone mockup surrounded by top/bottom reviews & stats (col-span-6) */}
          <div className="col-span-12 lg:col-span-6 order-1 lg:order-2 flex flex-col items-center gap-6">
            
            {/* Top Review (wrapped directly above phone) */}
            <div className="w-full max-w-md relative z-10">
              <ReviewCard rev={topReview} />
            </div>

            {/* Middle part: stats flanking the interactive phone */}
            <div className="grid grid-cols-12 gap-4 items-center w-full">
              
              {/* Left Stats Cards (col-span-3) */}
              <div className="col-span-12 md:col-span-3 space-y-4 flex flex-col justify-center order-2 md:order-1">
                {/* Stat 1: 2.500+ Khách hàng hài lòng */}
                <div className="bg-white rounded-2xl p-4 border border-[#daebd0] shadow-[0_8px_30px_rgba(41,58,32,0.04)] hover:shadow-[0_15px_40px_rgba(41,58,32,0.1)] hover:-translate-y-0.5 transition-all duration-300 relative text-center flex flex-col items-center">
                  <div className="mb-2 text-[#425733] bg-[#edf3ea] p-2 rounded-xl">
                    <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-xl md:text-2xl font-extrabold text-[#293a20] tracking-tight">
                    <NumberTicker value={2500} suffix="+" />
                  </span>
                  <span className="mt-1 text-[11px] text-gray-500 font-bold tracking-wide">Khách hàng hài lòng</span>
                  
                  {/* SVG Arrow pointing Right */}
                  <svg className="w-14 h-8 text-[#425733]/30 absolute top-1/2 -right-16 -translate-y-1/2 hidden xl:block pointer-events-none" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 5C25 15 40 5 55 10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                    <path d="M48 5L55 10L49 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Stat 2: 500+ Sản phẩm handmade */}
                <div className="bg-white rounded-2xl p-4 border border-[#daebd0] shadow-[0_8px_30px_rgba(41,58,32,0.04)] hover:shadow-[0_15px_40px_rgba(41,58,32,0.1)] hover:-translate-y-0.5 transition-all duration-300 relative text-center flex flex-col items-center">
                  <div className="mb-2 text-[#425733] bg-[#edf3ea] p-2 rounded-xl">
                    <Sprout className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-xl md:text-2xl font-extrabold text-[#293a20] tracking-tight">
                    <NumberTicker value={500} suffix="+" />
                  </span>
                  <span className="mt-1 text-[11px] text-gray-500 font-bold tracking-wide">Sản phẩm handmade</span>

                  {/* SVG Arrow pointing Right-up */}
                  <svg className="w-14 h-8 text-[#425733]/30 absolute top-1/2 -right-16 -translate-y-1/2 hidden xl:block pointer-events-none" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 15C25 5 40 15 55 10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                    <path d="M48 14L55 10L49 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Smartphone Mockup in the Center (col-span-6) */}
              <div className="col-span-12 md:col-span-6 flex justify-center relative order-1 md:order-2 select-none">
                <div className="relative w-[380px] h-auto drop-shadow-[0_25px_50px_rgba(26,46,18,0.22)]">
                  <img
                    src="/fb.svg"
                    alt="Facebook profile mockup"
                    className="w-full h-auto"
                  />

                  {/* Hotspot 1: Bottom Bar Notification Bell */}
                  <button
                    type="button"
                    onClick={() => setIsNotificationOn(!isNotificationOn)}
                    className="absolute bottom-[4.8%] left-[69.5%] w-[12%] h-[6.5%] cursor-pointer rounded-full hover:bg-black/5 active:bg-black/10 transition-colors z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425733]"
                    aria-pressed={isNotificationOn}
                    aria-label="Bật tắt thông báo"
                    title="Bấm để bật/tắt Thông báo"
                  />

                  {/* Patch 1: Covers the Notification Red Badge when notification is off */}
                  {!isNotificationOn && (
                    <div className="absolute bottom-[8.5%] left-[76.2%] w-[4.2%] h-[2.3%] bg-white rounded-full z-20 pointer-events-none" />
                  )}

                  {/* Hotspot 2: "Đang mở cửa" status info line */}
                  <button
                    type="button"
                    onClick={() => setIsOpenStatus(!isOpenStatus)}
                    className="absolute top-[43.8%] left-[10%] w-[38%] h-[3%] cursor-pointer rounded hover:bg-black/5 active:bg-black/10 transition-colors z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425733]"
                    aria-pressed={isOpenStatus}
                    aria-label="Bật tắt trạng thái mở cửa"
                    title="Bấm để đóng/mở cửa Tiệm Rêu"
                  />

                  {/* Patch 2: Covers "Đang mở cửa" green status text when open status is off */}
                  {!isOpenStatus && (
                    <div className="absolute top-[43.8%] left-[17%] w-[25%] h-[3%] bg-white flex items-center z-20 pointer-events-none">
                      <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 bg-white pr-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        Đang đóng cửa
                      </span>
                    </div>
                  )}

                  {/* Hotspot 3: "Công cụ chuyên nghiệp" blue button */}
                  <button
                    type="button"
                    onClick={() => setIsDashboardActive(!isDashboardActive)}
                    className="absolute top-[32%] left-[11%] w-[41%] h-[4%] cursor-pointer rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425733]"
                    aria-pressed={isDashboardActive}
                    aria-label="Bật tắt trạng thái dashboard"
                    title="Bấm để bật/tắt trạng thái Dashboard"
                  />

                  {/* Patch 3: Covers "Công cụ chuyên nghiệp" when clicked */}
                  {isDashboardActive && (
                    <div className="absolute top-[32.1%] left-[11.2%] w-[40.6%] h-[3.8%] bg-[#edf2fa] hover:bg-[#e2eaf6] border border-[#d8e3f4] rounded-md flex items-center justify-center z-20 pointer-events-none">
                      <span className="text-[9.5px] font-bold text-[#0a58ca]">
                        ✓ Đã bật Dashboard
                      </span>
                    </div>
                  )}

                </div>
              </div>

              {/* Right Stats Cards (col-span-3) */}
              <div className="col-span-12 md:col-span-3 space-y-4 flex flex-col justify-center order-3">
                {/* Stat 3: 98% Đánh giá 5 sao */}
                <div className="bg-white rounded-2xl p-4 border border-[#daebd0] shadow-[0_8px_30px_rgba(41,58,32,0.04)] hover:shadow-[0_15px_40px_rgba(41,58,32,0.1)] hover:-translate-y-0.5 transition-all duration-300 relative text-center flex flex-col items-center">
                  <div className="mb-2 text-[#425733] bg-[#edf3ea] p-2 rounded-xl">
                    <Star className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-xl md:text-2xl font-extrabold text-[#293a20] tracking-tight">
                    <NumberTicker value={98} suffix="%" />
                  </span>
                  <span className="mt-1 text-[11px] text-gray-500 font-bold tracking-wide">Đánh giá 5 sao</span>

                  {/* SVG Arrow pointing Left */}
                  <svg className="w-14 h-8 text-[#425733]/30 absolute top-1/2 -left-16 -translate-y-1/2 hidden xl:block pointer-events-none" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M55 5C35 15 20 5 5 10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                    <path d="M12 5L5 10L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Stat 4: 3 năm Kinh nghiệm */}
                <div className="bg-white rounded-2xl p-4 border border-[#daebd0] shadow-[0_8px_30px_rgba(41,58,32,0.04)] hover:shadow-[0_15px_40px_rgba(41,58,32,0.1)] hover:-translate-y-0.5 transition-all duration-300 relative text-center flex flex-col items-center">
                  <div className="mb-2 text-[#425733] bg-[#edf3ea] p-2 rounded-xl">
                    <Trophy className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-xl md:text-2xl font-extrabold text-[#293a20] tracking-tight">
                    <NumberTicker value={3} suffix=" năm" />
                  </span>
                  <span className="mt-1 text-[11px] text-gray-500 font-bold tracking-wide">Kinh nghiệm</span>

                  {/* SVG Arrow pointing Left-up */}
                  <svg className="w-14 h-8 text-[#425733]/30 absolute top-1/2 -left-16 -translate-y-1/2 hidden xl:block pointer-events-none" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M55 15C35 5 20 15 5 10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                    <path d="M12 14L5 10L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Bottom Review (wrapped directly below phone) */}
            <div className="w-full max-w-md relative z-10">
              <ReviewCard rev={bottomReview} />
            </div>

          </div>

          {/* Right Column: 2 Reviews (col-span-3) */}
          <div className="col-span-12 lg:col-span-3 order-3">
            <div className="space-y-6 relative z-10 max-w-xl mx-auto lg:mx-0">
              {rightReviews.map((rev, index) => (
                <ReviewCard key={index} rev={rev} />
              ))}
            </div>
          </div>

        </div>

        {/* Centered quote block below */}
        <div className="mt-16 text-center max-w-3xl mx-auto border-t border-[#daebd0] pt-10">
          <p className="text-lg md:text-2xl font-bold italic text-[#293a20] leading-relaxed font-serif">
            “ Sự hài lòng, yêu mến và tin tưởng của quý khách hàng là động lực chăm sóc mảng xanh mỗi ngày của Tiệm Rêu Décor ”
          </p>
        </div>

      </div>
    </section>
  );
}
