"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 phút — data được coi là "mới" trong 5 phút
            gcTime: 10 * 60 * 1000, // 10 phút — cache giữ lại 10 phút sau khi không dùng
            retry: 1, // Retry 1 lần nếu lỗi
            refetchOnWindowFocus: false, // Không refetch khi focus lại window
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
