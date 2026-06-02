"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Bot, Sparkles, X, ShoppingBag, ExternalLink } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "db" | "fallback";
  isStreaming?: boolean;
  // Sản phẩm được gợi ý (parse từ nội dung AI)
  suggestedProducts?: { name: string; slug: string; price: string }[];
}

const QUICK_QUESTIONS = [
  "Cách chăm sóc terrarium? 🌿",
  "Sản phẩm phù hợp phòng ít sáng?",
  "Chính sách vận chuyển?",
  "Terrarium cho người mới?",
];

// Parse sản phẩm được AI đề cập (theo định dạng "Link: /san-pham/slug")
function extractProductLinks(text: string): { name: string; slug: string; price: string }[] {
  const products: { name: string; slug: string; price: string }[] = [];
  // Tìm pattern: "- Tên sản phẩm ... Link: /san-pham/slug"
  const lines = text.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/Link:\s*(\/san-pham\/[\w-]+)/);
    if (linkMatch) {
      const slug = linkMatch[1];
      // Lấy tên (trước dấu [)
      const nameMatch = line.match(/^[-•]\s*([^[⭐]+)/);
      const priceMatch = line.match(/—\s*([\d.,]+₫[^—]*)/);
      if (nameMatch) {
        products.push({
          name: nameMatch[1].replace("⭐", "").trim(),
          slug,
          price: priceMatch ? priceMatch[1].trim() : "",
        });
      }
    }
  }
  return products.slice(0, 3);
}

// Render text: tô đậm **bold**, chuyển link /san-pham/slug thành nút
function renderMessageContent(content: string) {
  // Xóa dòng "Link: /san-pham/..." khỏi hiển thị (đã xử lý riêng thành nút)
  const cleaned = content.replace(/\s*\|\s*Link:\s*\/san-pham\/[\w-]+/g, "");

  return cleaned.split("\n").map((line, i) => (
    <span key={i} className="block">
      {line
        .split(/(\*\*[^*]+\*\*)/g)
        .map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
    </span>
  ));
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Xin chào! 👋 Tôi là trợ lý AI của **Tiệm Rêu**.\nTôi có thể giúp bạn:\n• Tư vấn chọn terrarium phù hợp\n• Hướng dẫn chăm sóc cây\n• Gợi ý sản phẩm và giá cả",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
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

    // Thêm tin nhắn bot rỗng (streaming placeholder)
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", isStreaming: true },
    ]);

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

      // ── STREAMING MODE ──────────────────────────────────
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
            } catch { /* ignore */ }
          }
        }

        // Stream xong → parse product links
        const suggestedProducts = extractProductLinks(fullContent);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullContent || "Xin lỗi, tôi chưa thể trả lời câu này.",
            source: "ai",
            isStreaming: false,
            suggestedProducts,
          };
          return updated;
        });
      }
      // ── FALLBACK MODE (JSON) ────────────────────────────
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
      if (err instanceof Error && err.name === "AbortError") return;

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

  // Cursor nhấp nháy khi stream
  const StreamingCursor = () => (
    <span className="inline-block w-[2px] h-3.5 bg-[#4a7c3f] ml-0.5 align-middle rounded-full animate-pulse" />
  );

  return (
    <>
      {/* ── FLOATING BUTTON (fixed, mọi trang) ─────────── */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2.5">
        {/* Tooltip */}
        {!open && (
          <div
            className="bg-[#4a7c3f] text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-lg cursor-pointer select-none"
            style={{ animation: "chatPulse 2.5s ease-in-out infinite" }}
            onClick={() => setOpen(true)}
          >
            Tư vấn AI 24/7 🌿
          </div>
        )}

        {/* Nút tròn */}
        <button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center relative transition-all duration-300 hover:scale-110 active:scale-95"
          style={{ background: "linear-gradient(135deg, #4a7c3f 0%, #2d5a27 100%)" }}
          aria-label="Mở tư vấn AI"
        >
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </>
          )}
        </button>
      </div>

      {/* ── CHAT PANEL (slide từ phải, không overlay) ───── */}
      <div
        className={`fixed bottom-24 right-6 z-[9998] w-[360px] rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        style={{ maxHeight: "520px", display: "flex", flexDirection: "column" }}
        aria-hidden={!open}
      >
        {/* ── HEADER ─────────────────────────────────────── */}
        <div
          className="px-4 py-3.5 flex items-center gap-3 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #4a7c3f 0%, #2d5a27 100%)" }}
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-semibold text-sm">Trợ lý Tiệm Rêu</span>
              {isAIAvailable === true && (
                <span className="flex items-center gap-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full text-white/90">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI
                </span>
              )}
            </div>
            <p className="text-white/70 text-[11px]">
              {isAIAvailable === true ? "Powered by Ollama AI" : "Tư vấn 24/7"}
            </p>
          </div>
          {/* Nút đặt hàng trên header */}
          <a
            href="/san-pham"
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Shop
          </a>
        </div>

        {/* ── MESSAGES AREA ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3" style={{ background: "#f4f7f2" }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#4a7c3f" }}
                >
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div className="max-w-[84%] flex flex-col gap-1.5">
                {/* Bubble tin nhắn */}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "text-white rounded-br-sm"
                      : "text-gray-800 rounded-bl-sm shadow-sm bg-white"
                  }`}
                  style={msg.role === "user" ? { background: "#4a7c3f" } : {}}
                >
                  {msg.isStreaming && msg.content === "" ? (
                    // Dots loading khi chờ token đầu tiên
                    <div className="flex gap-1.5 items-center py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#4a7c3f", animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#4a7c3f", animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#4a7c3f", animationDelay: "300ms" }} />
                    </div>
                  ) : (
                    <>
                      {renderMessageContent(msg.content)}
                      {msg.isStreaming && <StreamingCursor />}
                    </>
                  )}
                </div>

                {/* Nút sản phẩm được gợi ý */}
                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {msg.suggestedProducts.map((p) => (
                      <a
                        key={p.slug}
                        href={p.slug}
                        className="flex items-center justify-between gap-2 bg-white border rounded-xl px-3 py-2 text-sm shadow-sm hover:shadow-md transition-all group"
                        style={{ borderColor: "#c8dbc4" }}
                      >
                        <span className="text-gray-800 font-medium text-xs truncate flex-1">{p.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {p.price && (
                            <span className="text-[11px] font-semibold" style={{ color: "#4a7c3f" }}>
                              {p.price}
                            </span>
                          )}
                          <div
                            className="flex items-center gap-1 text-white text-[10px] font-medium px-2 py-1 rounded-lg group-hover:opacity-90 transition-opacity"
                            style={{ background: "#4a7c3f" }}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            Xem
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ── QUICK QUESTIONS (chỉ hiện lúc đầu) ─────────── */}
        {messages.length === 1 && !isSending && (
          <div className="px-3.5 py-2.5 border-t" style={{ background: "#f4f7f2", borderColor: "#dce8d9" }}>
            <p className="text-[11px] text-gray-500 mb-2">Câu hỏi thường gặp:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q.replace(/ 🌿$/, ""))}
                  className="text-[11px] bg-white border hover:bg-[#f0f5ee] text-gray-700 px-2.5 py-1 rounded-full transition-colors"
                  style={{ borderColor: "#c8dbc4" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── INPUT AREA ─────────────────────────────────── */}
        <div className="px-3 py-2.5 bg-white border-t flex gap-2 items-end flex-shrink-0" style={{ borderColor: "#dce8d9" }}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              // Auto resize
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
            }}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent leading-relaxed"
            style={{ minHeight: "36px", maxHeight: "96px" }}
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <button
            onClick={() => sendMessage(message)}
            disabled={isSending || !message.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#4a7c3f" }}
            aria-label="Gửi"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Link xem tất cả sản phẩm */}
        <div className="bg-white pb-2 text-center">
          <a
            href="/san-pham"
            className="inline-flex items-center gap-1 text-[11px] hover:underline"
            style={{ color: "#4a7c3f" }}
          >
            <ExternalLink className="w-3 h-3" />
            Xem tất cả sản phẩm tại shop
          </a>
        </div>
      </div>

      {/* ── CSS animation ──────────────────────────────── */}
      <style jsx global>{`
        @keyframes chatPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
      `}</style>
    </>
  );
}
