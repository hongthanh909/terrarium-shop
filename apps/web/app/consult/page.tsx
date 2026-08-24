"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "Làm sao để chăm sóc terrarium?",
  "Cây nào phù hợp cho phòng ít sáng?",
  "Tưới nước bao lâu một lần?",
  "Terrarium cần đặt ở đâu?",
];

export default function ConsultPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào, tôi là trợ lý của Tiệm Rêu. Tôi có thể tư vấn cách chăm sóc hoặc giúp bạn tìm sản phẩm phù hợp.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [messages, loading, prefersReducedMotion]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || loading) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể nhận tư vấn lúc này");

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.response || "Tôi chưa hiểu câu hỏi. Bạn có thể mô tả cụ thể hơn không?" },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Có lỗi xảy ra. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 border-b border-border pb-7 sm:mb-9 sm:pb-9">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Trợ lý Tiệm Rêu
          </p>
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Hỏi nhanh về terrarium
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Nhận gợi ý chăm sóc và lựa chọn sản phẩm. Với đơn hàng cụ thể, bạn vẫn có thể nhắn trực tiếp cho admin.
          </p>
        </header>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-9">
          <section className="flex min-h-[560px] flex-col overflow-hidden rounded-lg border border-border bg-white sm:min-h-[620px]" aria-label="Cuộc trò chuyện tư vấn">
            <div className="flex items-center gap-3 border-b border-border bg-[#f7f8f6] px-4 py-3 sm:px-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-foreground text-white">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Rêu AI</p>
                <p className="text-xs text-muted-foreground">Tư vấn sản phẩm và chăm sóc</p>
              </div>
            </div>

            <div
              ref={messageListRef}
              className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6"
              aria-live="polite"
              aria-relevant="additions"
            >
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${message.role === "user" ? "border border-border bg-white text-foreground" : "bg-foreground text-white"}`}>
                    {message.role === "user" ? <User className="h-4 w-4" aria-hidden="true" /> : <Bot className="h-4 w-4" aria-hidden="true" />}
                  </span>
                  <div className={`max-w-[82%] rounded-md px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-foreground text-white" : "bg-muted text-foreground"}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-3" role="status">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground text-white">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">Đang chuẩn bị câu trả lời...</div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-border bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
              <div className="flex items-center gap-2">
                <label htmlFor="consult-message" className="sr-only">Câu hỏi tư vấn</label>
                <Input
                  id="consult-message"
                  name="message"
                  type="text"
                  autoComplete="off"
                  placeholder="Nhập câu hỏi của bạn..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  className="min-h-12 flex-1 rounded-md border-border bg-white px-3 text-base"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="h-12 w-12 shrink-0 rounded-md bg-foreground p-0 text-white hover:bg-foreground/85"
                  aria-label="Gửi câu hỏi"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
          </section>

          <aside>
            <h2 className="text-sm font-semibold text-foreground">Câu hỏi gợi ý</h2>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-none lg:flex-col lg:overflow-visible">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setInput(question)}
                  className="min-h-11 shrink-0 rounded-md border border-border bg-white px-4 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground lg:w-full"
                >
                  {question}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Câu trả lời từ AI chỉ mang tính tham khảo. Với tình trạng cây cụ thể, hãy gửi kèm ảnh trong cửa sổ chat hỗ trợ.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
