import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="mb-4 text-8xl font-bold text-primary/20">404</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Trang không tìm thấy
      </h1>
      <p className="text-gray-500 mb-8 max-w-md">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-12 items-center gap-2 rounded-control border border-primary bg-primary px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50 active:scale-[0.98]"
      >
        ← Về Trang Chủ
      </Link>
    </div>
  );
}
