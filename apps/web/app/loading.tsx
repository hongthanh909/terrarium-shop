export default function Loading() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-[#e3ebdd] via-[#f0f4ee] to-[#dce5d5]">
      <div className="flex flex-col items-center gap-5">
        {/* Spinner */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-[#c2d6b0] border-t-[#425733] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[#425733]/20" />
          </div>
        </div>
        <p
          className="text-[#425733]/70 font-medium text-sm tracking-widest uppercase"
          style={{ fontFamily: "'Dancing Script', cursive" }}
        >
          Đang tải...
        </p>
      </div>
    </div>
  );
}
