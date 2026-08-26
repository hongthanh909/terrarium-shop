"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: "5rem",
              fontWeight: "bold",
              color: "rgba(66, 87, 51, 0.2)",
              marginBottom: "1rem",
            }}
          >
            500
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            Đã xảy ra lỗi
          </h1>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "2rem",
              maxWidth: "28rem",
            }}
          >
            Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: "hsl(var(--primary))",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
