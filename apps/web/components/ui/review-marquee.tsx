"use client";

import { motion } from "framer-motion";
import {
  Star, ThumbsUp, Check, Search, ArrowLeft, MoreHorizontal,
  Mail, Clock, Leaf, Heart, Sparkles, MessageCircle
} from "lucide-react";

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

  const floatAnimation = (yOffset: number, duration: number) => ({
    animate: {
      y: [0, yOffset, 0],
      rotate: [0, 3, -3, 0],
    },
    transition: {
      duration,
      repeat: Infinity,
      ease: "easeInOut",
    }
  });

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

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ─── LEFT COLUMN: Smartphone Mockup (Col-span 5) ─────────────────────────── */}
          <div className="lg:col-span-5 flex justify-center relative z-10">
            
            {/* Floating reaction badges */}
            <motion.div
              {...floatAnimation(-12, 4.5)}
              className="absolute -top-4 -left-6 z-20 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(66,87,51,0.12)] border border-[#daebd0]"
            >
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            </motion.div>

            <motion.div
              {...floatAnimation(14, 5)}
              className="absolute top-1/4 -right-6 z-20 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(66,87,51,0.12)] border border-[#daebd0]"
            >
              <ThumbsUp className="w-5 h-5 text-[#425733] fill-[#425733]" />
            </motion.div>

            <motion.div
              {...floatAnimation(-8, 3.8)}
              className="absolute bottom-1/3 -left-8 z-20 w-11 h-11 bg-[#f4f8f2] rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(66,87,51,0.12)] border border-[#daebd0]"
            >
              <Leaf className="w-5 h-5 text-[#425733] fill-[#425733]/10" />
            </motion.div>

            <motion.div
              {...floatAnimation(10, 4.2)}
              className="absolute bottom-16 -right-4 z-20 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(66,87,51,0.12)] border border-[#daebd0]"
            >
              <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
            </motion.div>

            {/* Smartphone Outer Shell */}
            <div className="w-[300px] h-[590px] bg-black rounded-[44px] p-2.5 shadow-[0_25px_60px_-15px_rgba(26,46,18,0.25)] border-4 border-gray-800 relative overflow-hidden flex flex-col">
              
              {/* Dynamic Island Notch */}
              <div className="w-24 h-5.5 bg-black rounded-full absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
                <span className="w-2 h-2 bg-gray-900 rounded-full ml-auto mr-3" />
              </div>

              {/* Status Bar */}
              <div className="absolute top-3.5 left-0 right-0 px-6 flex justify-between items-center text-[10px] text-white font-semibold z-20 pointer-events-none">
                <span>19:42</span>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.07 19.64 10.47 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>
                  <span className="w-4 h-2 border border-white rounded-sm p-0.5 flex items-center"><span className="w-2.5 h-full bg-white rounded-xs" /></span>
                </div>
              </div>

              {/* Phone Content Screen */}
              <div className="flex-1 bg-[#18191a] text-white rounded-[34px] overflow-hidden flex flex-col pt-7 relative select-none">
                
                {/* Facebook Navigation Header Mockup */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/5 bg-[#242526] z-10 flex-shrink-0">
                  <ArrowLeft className="w-4 h-4 text-white/90" />
                  <span className="text-[11px] font-bold text-white/90 truncate max-w-[120px]">Tiệm Rêu Décor</span>
                  <div className="flex items-center gap-3">
                    <Search className="w-4 h-4 text-white/90" />
                    <MoreHorizontal className="w-4 h-4 text-white/90" />
                  </div>
                </div>

                {/* Profile Scroll Container */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
                  
                  {/* Cover Photo */}
                  <div className="h-28 bg-[#1c2c16] relative overflow-hidden flex flex-col justify-end p-2.5 border-b border-white/5">
                    <img src="/tiem_reu_cover_photo.png" alt="Cover" className="absolute inset-0 w-full h-full object-cover z-0 opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-0" />
                    <div className="relative z-10 text-left">
                      <p className="text-[7.5px] text-[#c3d3ba] font-bold uppercase tracking-wider mb-0.5">Bí kíp để rêu luôn xanh</p>
                      <p className="text-[5.5px] text-white/80 leading-normal max-w-[170px] font-medium">
                        ☀️ Cấp ánh sáng gián tiếp từ 6-8h/ngày.<br />
                        💧 Xịt ẩm nhẹ khoáng 2-3 ngày/lần.
                      </p>
                    </div>
                    {/* Mini brand label */}
                    <span className="absolute right-2.5 bottom-2 text-[7.5px] font-bold text-white/40 tracking-widest font-mono uppercase">tiệm Rêu Décor</span>
                  </div>

                  {/* Avatar & Basic Info */}
                  <div className="px-3.5 pt-2 relative flex-shrink-0">
                    {/* Overlapping Avatar */}
                    <div className="w-16 h-16 rounded-full border-3 border-[#18191a] absolute -top-8 left-3.5 overflow-hidden bg-[#242526] flex items-center justify-center shadow-md">
                      <img src="/logo.png" alt="Tiệm Rêu Avatar" className="w-[94%] h-[94%] object-cover rounded-full" />
                    </div>

                    <div className="pt-9">
                      <div className="flex items-center gap-1">
                        <h3 className="text-sm font-bold text-white">Tiệm Rêu Décor</h3>
                        <span className="w-3.5 h-3.5 bg-[#2374e1] rounded-full flex items-center justify-center text-[8px] font-bold text-white">✓</span>
                      </div>
                      
                      <p className="text-[9.5px] text-gray-400 mt-0.5 font-semibold">
                        2,3K người theo dõi · 0 đang theo dõi · 3 bài viết
                      </p>

                      <p className="text-[9.5px] text-gray-300 mt-1 font-medium leading-relaxed">
                        một chút rêu, một chút xanh.
                      </p>

                      <p className="text-[8.5px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                        <span>🌿 Người sáng tạo nội dung số</span>
                        <span>·</span>
                        <span className="text-[#2374e1]">@tiemreudecor</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="px-3.5 mt-2.5 flex gap-2 flex-shrink-0">
                    <button className="flex-1 bg-[#2374e1] hover:bg-[#1b5ebd] text-white rounded-md text-[10px] font-bold py-1.5 px-2 text-center transition-colors">
                      Nhắn tin
                    </button>
                    <button className="flex-1 bg-[#3a3b3c] hover:bg-[#4e4f50] text-white rounded-md text-[10px] font-bold py-1.5 px-2 text-center transition-colors">
                      Thích
                    </button>
                    <button className="bg-[#3a3b3c] hover:bg-[#4e4f50] text-white rounded-md px-2 py-1.5 flex items-center justify-center transition-colors">
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="h-px bg-white/5 my-3" />

                  {/* Profile Details List */}
                  <div className="px-3.5 space-y-2 text-[9.5px] text-gray-300 font-semibold flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-white">Xếp hạng 5.0 (256 lượt đánh giá)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 font-bold">Đang mở cửa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>tiemreudecor@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                      <span>Trang · Mua sắm & bán lẻ</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 my-3" />

                  {/* Mock Post Feed in Facebook Page Layout */}
                  <div className="px-3.5">
                    <div className="bg-[#242526] rounded-xl p-2.5 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 bg-white">
                          <img src="/logo.png" alt="logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white flex items-center gap-0.5">
                            Tiệm Rêu Décor <span className="w-2.5 h-2.5 bg-[#2374e1] rounded-full flex items-center justify-center text-[6px] text-white">✓</span>
                          </p>
                          <p className="text-[7.5px] text-gray-400 font-medium">2 ngày trước · 🌍</p>
                        </div>
                      </div>
                      <p className="text-[9.5px] text-gray-200 leading-normal mb-2">
                        🌿 Mảnh ghép bình yên của tự nhiên được chọn lọc kỹ lưỡng, chăm chút tỉ mỉ cho từng tác phẩm terrarium độc bản...
                      </p>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden relative bg-[#18191a] mb-2">
                        <img src="/tiem_reu_product_feed.png" alt="Product" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex justify-between items-center text-[8.5px] text-gray-400 font-semibold pt-1 border-t border-white/5">
                        <span className="flex items-center gap-1">
                          <span className="w-3.5 h-3.5 bg-[#2374e1] rounded-full flex items-center justify-center"><ThumbsUp className="w-2.5 h-2.5 text-white fill-white" /></span>
                          <span>182</span>
                        </span>
                        <span>32 bình luận · 12 chia sẻ</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Stacked Review Cards (Col-span 7) ─────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Header style from Image 1 */}
            <div className="mb-8 text-center lg:text-left">
              <span className="block font-serif italic text-[#6d8c5a] text-lg md:text-xl font-bold mb-1.5">
                Guest Testimonial
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a2e12] leading-tight tracking-tight">
                What They Say?
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
              className="mt-10 border-l-4 border-[#425733] pl-6 md:pl-8 text-left max-w-xl"
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



