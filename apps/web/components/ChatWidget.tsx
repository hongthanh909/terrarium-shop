"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle, Send, Bot, Sparkles, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "db" | "fallback";
  isStreaming?: boolean; // đang stream chưa xong
}

const QUICK_QUESTIONS = [
  "Cách chăm sóc terrarium?",
  "Có sản phẩm nào phù hợp phòng ít sáng?",
  "Chính sách vận chuyển?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Xin chào! 👋 Tôi là trợ lý AI của Tiệm Rêu.\nTôi có thể tư vấn về:\n• Chăm sóc terrarium\n• Chọn sản phẩm phù hợp\n• Giá cả và đặt hàng",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea khi mở dialog
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const userMsg = text.trim();
    setMessage("");

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMsg },
    ];
    setMessages(newMessages);
    setIsSending(true);

    const history = newMessages.slice(1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Thêm tin nhắn bot rỗng (sẽ fill dần bằng stream)
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", isStreaming: true },
    ]);

    // AbortController để cancel stream nếu cần
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: history.slice(0, -1),
        }),
        signal: controller.signal,
      });

      const contentType = res.headers.get("Content-Type") ?? "";

      // ── STREAMING MODE (Ollama online) ──────────────────
      if (contentType.includes("text/event-stream")) {
        setIsAIAvailable(true);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              const token = parsed.token ?? "";
              if (token) {
                fullContent += token;
                // Cập nhật từng token vào tin nhắn cuối cùng
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: fullContent,
                    source: "ai",
                    isStreaming: true,
                  };
                  return updated;
                });
              }
            } catch {
              // Parse error → bỏ qua token này
            }
          }
        }

        // Stream xong → tắt isStreaming
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullContent || "Xin lỗi, tôi chưa thể trả lời câu này.",
            source: "ai",
            isStreaming: false,
          };
          return updated;
        });
      }
      // ── FALLBACK MODE (JSON bình thường) ───────────────
      else {
        const data = await res.json();

        if (data.source === "fallback") setIsAIAvailable(false);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: data.response || "Xin lỗi, tôi chưa hiểu câu hỏi của bạn.",
            source: data.source,
            isStreaming: false,
          };
          return updated;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return; // User huỷ

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ trực tiếp nhé! 🌿",
          isStreaming: false,
        };
        return updated;
      });
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(message);
    }
  };

  // Typing cursor animation khi đang stream
  const StreamingCursor = () => (
    <span
      className="inline-block w-0.5 h-3.5 bg-[#425733] ml-0.5 align-middle animate-pulse"
      aria-hidden="true"
    />
  );

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!open && (
          <div className="bg-[#425733] text-white text-xs px-3 py-1.5 rounded-full shadow-lg animate-pulse">
            Tư vấn AI 24/7 🤖
          </div>
        )}
        <Button
          onClick={() => setOpen(!open)}
          size="icon"
          className="w-14 h-14 rounded-full shadow-lg bg-[#425733] hover:bg-[#364a29] hover:scale-105 transition-all duration-300 relative"
          aria-label="Open AI chat consultation"
        >
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </>
          )}
        </Button>
      </div>

      {/* Chat dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="bg-gradient-to-r from-[#425733] to-[#4d6b3d] px-5 py-4">
            <DialogTitle className="flex items-center gap-2.5 text-white font-bold">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  Trợ lý Tiệm Rêu
                  {isAIAvailable === true && (
                    <span className="flex items-center gap-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-normal">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </span>
                  )}
                </div>
                <p className="text-white/70 text-xs font-normal">
                  {isAIAvailable === true
                    ? "Powered by Ollama AI"
                    : "Tư vấn 24/7"}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col" style={{ height: "420px" }}>
            {/* Messages area */}
            <div className="flex-1 bg-[#f5f7f3] p-4 overflow-y-auto space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-[#425733] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#425733] text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {/* Nếu đang stream và chưa có nội dung → hiện typing dots */}
                    {msg.isStreaming && msg.content === "" ? (
                      <div className="flex gap-1.5 items-center py-0.5">
                        <span className="w-1.5 h-1.5 bg-[#425733] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-[#425733] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-[#425733] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : (
                      <>
                        {msg.content}
                        {/* Cursor nhấp nháy khi đang stream có nội dung */}
                        {msg.isStreaming && <StreamingCursor />}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions (chỉ hiện khi chỉ có 1 tin nhắn đầu) */}
            {messages.length === 1 && !isSending && (
              <div className="px-4 py-2 bg-[#f5f7f3] border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Câu hỏi thường gặp:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs bg-white border border-[#c8d5be] hover:border-[#425733] hover:bg-[#f0f4ec] text-gray-700 px-2.5 py-1 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 resize-none rounded-xl border-[#c8d5be] focus:border-[#425733] focus-visible:ring-[#425733]/30 text-sm min-h-[40px] max-h-[100px]"
                rows={1}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
              <Button
                onClick={() => sendMessage(message)}
                disabled={isSending || !message.trim()}
                size="icon"
                className="h-10 w-10 rounded-xl bg-[#425733] hover:bg-[#364a29] flex-shrink-0 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
