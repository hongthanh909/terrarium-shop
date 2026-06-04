import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl font-bold text-[#425733]/20 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Trang không tìm thấy
      </h1>
      <p className="text-gray-500 mb-8 max-w-md">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#364a29] transition-all"
      >
        ← Về Trang Chủ
      </Link>
    </div>
  );
}
