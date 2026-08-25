"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Star, ShoppingBag, Sprout, Trophy
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
    avatarBg: "from-[#c5b8aa] to-[#8d7b6a]",
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
    avatarBg: "from-[#d6d3ce] to-[#9c9890]",
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
    avatarBg: "from-[#bca28d] to-[#8a705c]",
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
    avatarBg: "from-[#d8d6d1] to-[#aaa69e]",
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
    avatarBg: "from-[#a99887] to-[#736557]",
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
    avatarBg: "from-[#e3dfda] to-[#b9b2a9]",
    initials: "TC",
    isGreenBg: false,
    tiltClass: "md:rotate-0.5"
  }
];

function ReviewCard({ rev }: { rev: typeof reviews[0] }) {
  return (
    <div
      className={`group flex cursor-default items-start gap-4 rounded-lg border p-4 opacity-95 transition-[border-color,box-shadow] duration-200 hover:border-foreground/20 hover:opacity-100 hover:shadow-soft-lg md:p-5 ${
        rev.isGreenBg 
          ? "border-border bg-[#f7f8f6]"
          : "border-border bg-white"
      }`}
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
            <span className="mt-0.5 block text-xs font-semibold text-gray-500 transition-colors duration-300 group-hover:text-gray-600">
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
    <section className={`relative overflow-hidden border-t border-border bg-white px-6 py-24 ${className || ""}`}>
      <div className="max-w-7xl mx-auto">
        {/* Centered section header with underline */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="relative inline-block pb-4 font-serif text-3xl font-semibold text-foreground md:text-4xl">
            Feedback từ khách hàng đến Rêu
            <span className="absolute bottom-0 left-1/2 h-px w-28 -translate-x-1/2 bg-foreground/30" />
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
                <div className="relative flex flex-col items-center rounded-lg border border-border bg-white p-4 text-center transition-shadow duration-200 hover:shadow-soft-lg">
                  <div className="mb-2 rounded-md bg-muted p-2 text-foreground">
                    <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-xl font-extrabold text-foreground md:text-2xl">
                    <NumberTicker value={2500} suffix="+" />
                  </span>
                  <span className="mt-1 text-xs font-bold tracking-wide text-gray-500">Khách hàng hài lòng</span>
                  
                  {/* SVG Arrow pointing Right */}
                  <svg className="pointer-events-none absolute -right-16 top-1/2 hidden h-8 w-14 -translate-y-1/2 text-foreground/20 xl:block" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 5C25 15 40 5 55 10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                    <path d="M48 5L55 10L49 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Stat 2: 500+ Sản phẩm handmade */}
                <div className="relative flex flex-col items-center rounded-lg border border-border bg-white p-4 text-center transition-shadow duration-200 hover:shadow-soft-lg">
                  <div className="mb-2 rounded-md bg-muted p-2 text-foreground">
                    <Sprout className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-xl font-extrabold text-foreground md:text-2xl">
                    <NumberTicker value={500} suffix="+" />
                  </span>
                  <span className="mt-1 text-xs font-bold tracking-wide text-gray-500">Sản phẩm handmade</span>

                  {/* SVG Arrow pointing Right-up */}
                  <svg className="pointer-events-none absolute -right-16 top-1/2 hidden h-8 w-14 -translate-y-1/2 text-foreground/20 xl:block" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 15C25 5 40 15 55 10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                    <path d="M48 14L55 10L49 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Smartphone Mockup in the Center (col-span-6) */}
              <div className="col-span-12 md:col-span-6 flex justify-center relative order-1 md:order-2 select-none">
                <div className="relative h-auto w-full max-w-[380px] drop-shadow-[0_25px_50px_rgba(26,46,18,0.22)]">
                  <Image
                    src="/fb.svg"
                    alt="Facebook profile mockup"
                    width={1080}
                    height={1080}
                    className="h-auto w-full"
                  />

                  {/* Hotspot 1: Bottom Bar Notification Bell */}
                  <button
                    type="button"
                    onClick={() => setIsNotificationOn(!isNotificationOn)}
                    className="absolute bottom-[4.8%] left-[69.5%] z-30 h-[6.5%] w-[12%] cursor-pointer rounded-full transition-colors hover:bg-black/5 active:bg-black/10"
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
                    className="absolute left-[10%] top-[43.8%] z-30 h-[3%] w-[38%] cursor-pointer rounded transition-colors hover:bg-black/5 active:bg-black/10"
                    aria-pressed={isOpenStatus}
                    aria-label="Bật tắt trạng thái mở cửa"
                    title="Bấm để đóng/mở cửa Tiệm Rêu"
                  />

                  {/* Patch 2: Covers "Đang mở cửa" green status text when open status is off */}
                  {!isOpenStatus && (
                    <div className="absolute top-[43.8%] left-[17%] w-[25%] h-[3%] bg-white flex items-center z-20 pointer-events-none">
                      <span className="flex items-center gap-1 bg-white pr-2 text-xs font-bold text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        Đang đóng cửa
                      </span>
                    </div>
                  )}

                  {/* Hotspot 3: "Công cụ chuyên nghiệp" blue button */}
                  <button
                    type="button"
                    onClick={() => setIsDashboardActive(!isDashboardActive)}
                    className="absolute left-[11%] top-[32%] z-30 h-[4%] w-[41%] cursor-pointer rounded-md transition-colors hover:bg-white/10 active:bg-white/20"
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
                <div className="relative flex flex-col items-center rounded-lg border border-border bg-white p-4 text-center transition-shadow duration-200 hover:shadow-soft-lg">
                  <div className="mb-2 rounded-md bg-muted p-2 text-foreground">
                    <Star className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-xl font-extrabold text-foreground md:text-2xl">
                    <NumberTicker value={98} suffix="%" />
                  </span>
                  <span className="mt-1 text-xs font-bold tracking-wide text-gray-500">Đánh giá 5 sao</span>

                  {/* SVG Arrow pointing Left */}
                  <svg className="pointer-events-none absolute -left-16 top-1/2 hidden h-8 w-14 -translate-y-1/2 text-foreground/20 xl:block" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M55 5C35 15 20 5 5 10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                    <path d="M12 5L5 10L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Stat 4: 3 năm Kinh nghiệm */}
                <div className="relative flex flex-col items-center rounded-lg border border-border bg-white p-4 text-center transition-shadow duration-200 hover:shadow-soft-lg">
                  <div className="mb-2 rounded-md bg-muted p-2 text-foreground">
                    <Trophy className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <span className="text-xl font-extrabold text-foreground md:text-2xl">
                    <NumberTicker value={3} suffix=" năm" />
                  </span>
                  <span className="mt-1 text-xs font-bold tracking-wide text-gray-500">Kinh nghiệm</span>

                  {/* SVG Arrow pointing Left-up */}
                  <svg className="pointer-events-none absolute -left-16 top-1/2 hidden h-8 w-14 -translate-y-1/2 text-foreground/20 xl:block" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <div className="mx-auto mt-16 max-w-3xl border-t border-border pt-10 text-center">
          <p className="font-serif text-lg font-bold italic leading-relaxed text-foreground md:text-2xl">
            “ Sự hài lòng, yêu mến và tin tưởng của quý khách hàng là động lực chăm sóc mảng xanh mỗi ngày của Tiệm Rêu Décor ”
          </p>
        </div>

      </div>
    </section>
  );
}
