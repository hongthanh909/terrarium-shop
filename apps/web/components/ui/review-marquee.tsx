"use client";

import { motion } from "framer-motion";
import {
  Star, ThumbsUp, Check, Search, ArrowLeft, MoreHorizontal,
  Mail, Clock, Leaf, Heart, Sparkles, MessageCircle,
  ShoppingBag, Sprout, Trophy, Sliders, Settings, PlayCircle, PlusCircle, Bell, Camera
} from "lucide-react";
import { NumberTicker } from "./number-ticker";

export function ReviewMarquee({ className }: { className?: string }) {
  // 4 primary positive reviews matching the requested Vietnamese contents
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
      tiltClass: "md:-translate-x-4 rotate-1.5 hover:rotate-0 hover:-translate-y-1 hover:shadow-lg"
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
      tiltClass: "md:translate-x-4 -rotate-1 hover:rotate-0 hover:-translate-y-1 hover:shadow-lg"
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
      tiltClass: "md:-translate-x-3 rotate-1 hover:rotate-0 hover:-translate-y-1 hover:shadow-lg"
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
      tiltClass: "md:translate-x-3 -rotate-1.5 hover:rotate-0 hover:-translate-y-1 hover:shadow-lg"
    }
  ];

  return (
    <section className={`py-24 px-6 bg-gradient-to-br from-[#fafbf8] to-[#edf3ea] overflow-hidden relative ${className || ""}`}>
      {/* Decorative leaf shapes in background */}
      <div className="absolute top-10 left-10 text-[#425733]/5 pointer-events-none select-none">
        <Leaf size={140} className="rotate-45" />
      </div>
      <div className="absolute bottom-10 right-10 text-[#425733]/5 pointer-events-none select-none">
        <Leaf size={140} className="-rotate-12" />
      </div>

      {/* Decorative Dot Patterns from Image 1 */}
      <div className="absolute top-12 right-12 w-16 h-16 opacity-20 hidden lg:block" style={{ backgroundImage: "radial-gradient(#425733 2px, transparent 0)", backgroundSize: "8px 8px" }} />
      <div className="absolute bottom-12 left-12 w-16 h-16 opacity-20 hidden lg:block" style={{ backgroundImage: "radial-gradient(#425733 2px, transparent 0)", backgroundSize: "8px 8px" }} />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ─── LEFT COLUMN: Smartphone Mockup Surrounded by Stats (Col-span 7) ─────────── */}
          <div className="lg:col-span-7 grid grid-cols-12 items-center gap-4 relative z-10">
            
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
            <div className="col-span-12 md:col-span-6 flex justify-center relative order-1 md:order-2">
              
              {/* Smartphone Outer Shell */}
              <div className="w-[300px] h-[590px] bg-black rounded-[44px] p-2.5 shadow-[0_25px_60px_-15px_rgba(26,46,18,0.25)] border-4 border-gray-800 relative overflow-hidden flex flex-col">
                
                {/* Dynamic Island Notch */}
                <div className="w-24 h-5.5 bg-black rounded-full absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
                  <span className="w-2 h-2 bg-gray-900 rounded-full ml-auto mr-3" />
                </div>

                {/* Status Bar */}
                <div className="absolute top-3.5 left-0 right-0 px-5 flex justify-between items-center text-[9px] text-white font-semibold z-20 pointer-events-none">
                  <div className="flex items-center gap-1">
                    <span>19:42</span>
                    <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.07 19.64 10.47 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>
                    <span className="w-4 h-2 border border-white rounded-sm p-0.5 flex items-center"><span className="w-2.5 h-full bg-white rounded-xs" /></span>
                    <span className="text-[7.5px] scale-90">21</span>
                  </div>
                </div>

                {/* Phone Content Screen - STRICT STATIC EXACT SCREENSHOT DESIGN */}
                <div className="flex-1 bg-[#18191a] text-white rounded-[34px] overflow-hidden flex flex-col pt-7 relative select-none">
                  
                  {/* Facebook Navigation Header Mockup */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#242526] z-10 flex-shrink-0">
                    <ArrowLeft className="w-3.5 h-3.5 text-white/90" />
                    <div className="flex-1 mx-3 bg-[#3a3b3c] rounded-full py-1 px-3 text-[9px] text-gray-300 font-semibold truncate flex items-center gap-1.5">
                      <Search className="w-2.5 h-2.5 text-gray-400" />
                      <span>tiệm Rêu Décor</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MoreHorizontal className="w-3.5 h-3.5 text-white/90" />
                    </div>
                  </div>

                  {/* Profile Screen - Scrollable but no visual scroll indicators */}
                  <div className="flex-1 overflow-y-auto no-scrollbar pb-3">
                    
                    {/* Cover Photo */}
                    <div className="h-28 bg-[#1c2c16] relative overflow-hidden flex flex-col justify-end p-2 border-b border-white/5">
                      <img src="/tiem_reu_cover_photo.png" alt="Cover" className="absolute inset-0 w-full h-full object-cover z-0 opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-0" />
                      {/* Camera icon in corner */}
                      <button className="absolute right-2 bottom-2 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center border border-white/10 z-10">
                        <Camera className="w-3 h-3 text-white" />
                      </button>
                    </div>

                    {/* Avatar & Basic Info */}
                    <div className="px-3 pt-2 relative flex-shrink-0">
                      {/* Overlapping Avatar */}
                      <div className="w-16 h-16 rounded-full border-3 border-[#18191a] absolute -top-8 left-3 overflow-hidden bg-[#242526] flex items-center justify-center shadow-md">
                        <img src="/logo.png" alt="Avatar" className="w-[94%] h-[94%] object-cover rounded-full" />
                        <button className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#3a3b3c] border border-white/20 flex items-center justify-center">
                          <Camera className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>

                      {/* Profile text info */}
                      <div className="pt-9">
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          Tiệm Rêu Décor
                        </h3>
                        
                        <p className="text-[9px] text-gray-400 mt-0.5 font-semibold">
                          2,3K người theo dõi · 0 đang theo dõi · 3 bài viết
                        </p>

                        <p className="text-[9px] text-gray-300 mt-1 font-medium leading-normal">
                          một chút rêu, một chút xanh.
                        </p>

                        <p className="text-[8px] text-gray-400 mt-1.5 font-semibold flex items-center gap-1">
                          <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          <span>Người sáng tạo nội dung số</span>
                          <span>·</span>
                          <span>@tiemreudecor</span>
                        </p>
                      </div>
                    </div>

                    {/* Action buttons (Ảnh gốc style) */}
                    <div className="px-3 mt-3 flex gap-2 flex-shrink-0">
                      <button className="flex-1 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg text-[9px] font-bold py-2 px-2 flex items-center justify-center gap-1.5 transition-colors">
                        <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                        <span>Công cụ chuyên nghiệp</span>
                      </button>
                      <button className="flex-1 bg-[#3a3b3c] hover:bg-[#4e4f50] text-white rounded-lg text-[9px] font-bold py-2 px-2 flex items-center justify-center gap-1.5 transition-colors">
                        <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
                        <span>Quảng cáo</span>
                      </button>
                      <button className="bg-[#3a3b3c] hover:bg-[#4e4f50] text-white rounded-lg px-2.5 py-2 flex items-center justify-center transition-colors">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Secondary Tabs bar (Tất cả, Ảnh, Reels,...) */}
                    <div className="px-3 mt-3.5 flex gap-2 text-[9px] font-bold overflow-x-auto no-scrollbar">
                      <span className="bg-[#3a3b3c] text-white px-3 py-1.5 rounded-full whitespace-nowrap">Tất cả</span>
                      <span className="text-gray-400 px-3 py-1.5 whitespace-nowrap">Ảnh</span>
                      <span className="text-gray-400 px-3 py-1.5 whitespace-nowrap">Reels</span>
                      <span className="text-gray-400 px-3 py-1.5 whitespace-nowrap">Sự kiện</span>
                      <span className="text-gray-400 px-3 py-1.5 whitespace-nowrap">Lượt nhắc</span>
                    </div>

                    <div className="h-px bg-white/5 my-3" />

                    {/* Profile Details List */}
                    <div className="px-3 space-y-2.5 text-[9px] text-gray-300 font-semibold flex-shrink-0">
                      <div className="text-[10px] font-bold text-white flex justify-between items-center mb-1">
                        <span>Chi tiết</span>
                        <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-gray-400" />
                        <span>Chưa xếp hạng (0 lượt đánh giá)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-red-400">Đang đóng cửa</span>
                      </div>

                      <div className="text-[10px] font-bold text-white flex justify-between items-center pt-2 mb-1">
                        <span>Thông tin liên hệ</span>
                        <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-bold">@</span>
                        <span>tiemreudecor + 1</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>tiemreudecor@gmail.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                        <span>Tiệm Rêu Décor</span>
                      </div>
                    </div>

                    <div className="h-px bg-white/5 my-3" />

                    {/* Post composer block */}
                    <div className="px-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-white mb-2">
                        <span>Tất cả bài viết</span>
                        <div className="flex items-center gap-1 bg-[#3a3b3c] rounded px-2 py-0.5 text-[8.5px]">
                          <Sliders className="w-2.5 h-2.5 text-gray-400" />
                          <span>Bộ lọc</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2 bg-[#242526] rounded-xl p-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-white">
                          <img src="/logo.png" alt="User" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[8.5px] text-gray-400 flex-1">Bạn đang nghĩ gì?</span>
                        <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                      </div>

                      <div className="flex gap-2 text-[8px] font-bold pt-1">
                        <span className="flex-1 bg-[#242526] py-1 px-2 rounded-lg flex items-center justify-center gap-1.5">
                          <svg className="w-3 h-3 text-red-500 fill-red-500/20" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                          <span>Phát trực tiếp</span>
                        </span>
                        <span className="flex-1 bg-[#242526] py-1 px-2 rounded-lg flex items-center justify-center gap-1.5">
                          <svg className="w-3 h-3 text-pink-500 fill-pink-500/20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>
                          <span>Thước phim</span>
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* App Navigation Bar at Very Bottom */}
                  <div className="h-10 bg-[#242526] border-t border-white/5 flex items-center justify-around px-2 text-gray-400 flex-shrink-0">
                    <svg className="w-4 h-4 text-[#1877f2]" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                    <PlayCircle className="w-4 h-4" />
                    <PlusCircle className="w-4 h-4" />
                    <div className="relative">
                      <Bell className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[6px] font-extrabold w-3 h-3 rounded-full flex items-center justify-center">5</span>
                    </div>
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 bg-white">
                      <img src="/logo.png" alt="logo" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Home Indicator Line */}
                  <div className="h-4 bg-[#242526] flex items-center justify-center flex-shrink-0 pb-1.5">
                    <span className="w-20 h-0.5 bg-white/70 rounded-full" />
                  </div>

                </div>
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

          {/* ─── RIGHT COLUMN: Stacked Review Cards (Col-span 5) ─────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            
            {/* Header style from Image 1, translated as requested */}
            <div className="mb-8 text-center lg:text-left">
              <span className="block font-serif italic text-[#6d8c5a] text-lg md:text-xl font-bold mb-1.5">
                Guest Testimonial
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1a2e12] leading-tight tracking-tight">
                Feedback từ khách hàng đến Rêu
              </h2>
            </div>

            {/* Stacked Cards Container */}
            <div className="space-y-4 md:space-y-5 relative z-10 max-w-xl mx-auto lg:mx-0">
              {reviews.map((rev, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-4 md:p-5 shadow-[0_8px_30px_rgba(41,58,32,0.04)] border border-[#daebd0] transition-all duration-300 flex items-start gap-4 cursor-default ${
                    rev.isGreenBg ? "bg-[#e8efe2]" : "bg-white"
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
                        <h4 className="font-bold text-gray-800 text-xs md:text-sm truncate">
                          {rev.name}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
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
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                      "{rev.text}"
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Giant quote block quote below (Gộp nội dung ảnh 2) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 border-l-4 border-[#425733] pl-6 md:pl-8 text-left max-w-xl font-serif"
            >
              <p className="text-lg md:text-2xl font-bold italic text-[#293a20] leading-relaxed font-serif">
                “ Sự hài lòng, yêu mến và tin tưởng của quý khách hàng là động lực chăm sóc mảng xanh mỗi ngày của Tiệm Rêu Décor ”
              </p>
            </motion.div>

          </div>
          
        </div>
      </div>
    </section>
  );
}




