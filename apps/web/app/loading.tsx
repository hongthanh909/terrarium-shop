import { Leaf } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-[#e3ebdd] via-[#c8d5be] to-[#6d8c5a]">
      <div className="flex flex-col items-center gap-4 bg-white/20 p-8 rounded-3xl backdrop-blur-md shadow-soft-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-[#425733] blur-xl opacity-20 rounded-full animate-pulse" />
          <Leaf className="w-16 h-16 text-[#425733] animate-bounce relative z-10" />
        </div>
        <p className="text-[#425733] font-bold text-lg tracking-widest uppercase animate-pulse">
          Đang tải...
        </p>
      </div>
    </div>
  );
}
