"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Nguyễn Thị Lan",
    avatar: "🌿",
    rating: 5,
    text: "Terrarium đẹp hơn hình rất nhiều! Cây rất khỏe, đóng gói cẩn thận. Sẽ mua lại!",
    product: "Terrarium Rêu Suối Mini",
    verified: true,
  },
  {
    name: "Trần Minh Khoa",
    avatar: "🌱",
    rating: 5,
    text: "Shop tư vấn rất nhiệt tình, giao hàng nhanh. Terrarium đặt bàn làm việc trông sang lắm.",
    product: "Terrarium Cactus Desert",
    verified: true,
  },
  {
    name: "Phạm Thu Hà",
    avatar: "🍃",
    rating: 5,
    text: "Mua làm quà tặng sinh nhật bạn, được khen không ngớt. Thiết kế tinh tế, rất đáng tiền.",
    product: "Bộ Quà Tặng Terrarium",
    verified: true,
  },
  {
    name: "Lê Văn Hùng",
    avatar: "🌊",
    rating: 5,
    text: "Chất lượng tuyệt vời, nhân viên support nhiệt tình. Terrarium vẫn xanh tốt sau 3 tháng!",
    product: "Terrarium Rêu Biển",
    verified: true,
  },
  {
    name: "Võ Thị Mai",
    avatar: "🎋",
    rating: 5,
    text: "Sản phẩm handmade thực sự, mỗi cái đều unique. Mình mua 3 cái rồi vẫn muốn mua thêm.",
    product: "Terrarium Tre Trúc",
    verified: false,
  },
  {
    name: "Đặng Quốc Bảo",
    avatar: "🌺",
    rating: 5,
    text: "Hướng dẫn chăm sóc kèm theo rất chi tiết. Người không có kinh nghiệm như mình cũng nuôi được.",
    product: "Terrarium Cẩm Thạch",
    verified: true,
  },
];

function ReviewCard({ review, className }: { review: typeof REVIEWS[0]; className?: string }) {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-72 bg-white rounded-2xl border border-[#e3ebdd] border-t-2 border-t-[#a8c098] p-5 shadow-sm mx-3",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#e3ebdd] flex items-center justify-center text-xl flex-shrink-0">
          {review.avatar}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{review.name}</p>
          <p className="text-xs text-gray-400 truncate">{review.product}</p>
        </div>
        {review.verified && (
          <span className="ml-auto flex-shrink-0 text-[10px] bg-green-50 text-green-600 border border-green-200 rounded-full px-2 py-0.5 font-medium">
            ✓ Đã mua
          </span>
        )}
      </div>

      <div className="flex gap-0.5 mb-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
          />
        ))}
      </div>

      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">&ldquo;{review.text}&rdquo;</p>
    </div>
  );
}

export function ReviewMarquee({ className }: { className?: string }) {
  // Duplicate for infinite seamless loop
  const row1 = [...REVIEWS, ...REVIEWS];

  return (
    <section className={cn("py-16 overflow-hidden bg-[#f8faf6]", className)}>
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-[#e3ebdd] text-[#425733] text-sm font-medium mb-3">
            ⭐ Đánh giá thực từ khách hàng
          </span>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #1a2e12, #425733)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Khách hàng nói gì về chúng tôi</h2>
        </motion.div>
      </div>

      {/* Marquee row — LTR */}
      <div className="relative">
        {/* Fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#f8faf6] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#f8faf6] to-transparent" />

        <motion.div
          className="flex"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {row1.map((review, i) => (
            <ReviewCard key={`r1-${i}`} review={review} />
          ))}
        </motion.div>
      </div>

      {/* Marquee row — RTL (offset) */}
      <div className="relative mt-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#f8faf6] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#f8faf6] to-transparent" />

        <motion.div
          className="flex"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          {[...REVIEWS].reverse().concat([...REVIEWS].reverse()).map((review, i) => (
            <ReviewCard key={`r2-${i}`} review={review} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
