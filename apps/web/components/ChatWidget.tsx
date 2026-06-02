"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Send, Bot, Sparkles, X,
  ShoppingBag, ExternalLink, RefreshCw
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "db" | "fallback";
  isStreaming?: boolean;
  suggestedProducts?: { name: string; slug: string; price: string }[];
}

const QUICK_QUESTIONS = [
  "Cách chăm sóc terrarium?",
  "Sản phẩm phòng ít sáng?",
  "Chính sách vận chuyển?",
  "Terrarium cho người mới?",
];

function extractProductLinks(text: string): { name: string; slug: string; price: string }[] {
  const products: { name: string; slug: string; price: string }[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/Link:\s*(\/san-pham\/[\w-]+)/);
    if (linkMatch) {
      const slug = linkMatch[1];
      const nameMatch = line.match(/^[-•]\s*([^[⭐]+)/);
      const priceMatch = line.match(/—\s*([\d.,]+₫[^|—]*)/);
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

function renderContent(content: string) {
  const cleaned = content.replace(/\s*\|\s*Link:\s*\/san-pham\/[\w-]+/g, "");
  return cleaned.split("\n").map((line, i) => (
    <span key={i} className="block">
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : <span key={j}>{part}</span>
      )}
    </span>
  ));
}

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "Xin chào! 👋 Tôi là trợ lý AI của **Tiệm Rêu**.\nTôi có thể giúp bạn:\n• Tư vấn chọn terrarium phù hợp\n• Hướng dẫn chăm sóc cây\n• Gợi ý sản phẩm và giá cả",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  const resetChat = () => {
    abortControllerRef.current?.abort();
    setMessages([INITIAL_MESSAGE]);
    setMessage("");
    setIsSending(false);
    setIsAIAvailable(null);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;
    const userMsg = text.trim();
    setMessage("");

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsSending(true);

    const history = newMessages.slice(1).map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "assistant", content: "", isStreaming: true }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: history.slice(0, -1) }),
        signal: controller.signal,
      });

      const contentType = res.headers.get("Content-Type") ?? "";

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
              const token = JSON.parse(data).token ?? "";
              if (token) {
                fullContent += token;
                setMessages((prev) => {
                  const u = [...prev];
                  u[u.length - 1] = { role: "assistant", content: fullContent, source: "ai", isStreaming: true };
                  return u;
                });
              }
            } catch { /* ignore */ }
          }
        }

        const suggestedProducts = extractProductLinks(fullContent);
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = { role: "assistant", content: fullContent || "Xin lỗi, tôi chưa thể trả lời.", source: "ai", isStreaming: false, suggestedProducts };
          return u;
        });
      } else {
        const data = await res.json();
        if (data.source === "fallback") setIsAIAvailable(false);
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = { role: "assistant", content: data.response || "Xin lỗi, tôi chưa hiểu.", source: data.source, isStreaming: false };
          return u;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = { role: "assistant", content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại! 🌿", isStreaming: false };
        return u;
      });
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(message); }
  };

  const Cursor = () => (
    <span className="inline-block w-[2px] h-3.5 bg-[#4a7c3f] ml-0.5 align-middle rounded-full animate-pulse" />
  );

  return (
    <>
      {/* ═══════════════════════════════════════
          CHAT PANEL — fixed, bottom-right, above button
      ═══════════════════════════════════════ */}
      <div
        className={`fixed z-[9998] transition-all duration-300 ease-out`}
        style={{
          bottom: "90px",   // ngay trên nút chat
          right: "24px",
          width: "360px",
          height: "500px",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* ── HEADER ─────────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(135deg, #4a7c3f 0%, #2e5c25 100%)",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Bot size={20} color="white" />
          </div>

          {/* Name + status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>Trợ lý Tiệm Rêu</span>
              {isAIAvailable === true && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 3,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 99, padding: "2px 8px",
                  fontSize: 10, color: "white",
                }}>
                  <Sparkles size={10} /> AI
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 0 2px rgba(74,222,128,0.3)",
              }} />
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>Đang hoạt động</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {/* Shop link */}
            <a
              href="/san-pham"
              title="Xem sản phẩm"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", textDecoration: "none",
              }}
            >
              <ShoppingBag size={14} />
            </a>
            {/* Refresh */}
            <button
              onClick={resetChat}
              title="Làm mới cuộc trò chuyện"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.15)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white",
              }}
            >
              <RefreshCw size={14} />
            </button>
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              title="Thu nhỏ"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.15)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── MESSAGES ───────────────────────────── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 12px",
          background: "#f2f5f0",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          {messages.map((msg, i) => (
            <div key={i}>
              <div style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: 7,
                alignItems: "flex-end",
              }}>
                {/* Bot avatar */}
                {msg.role === "assistant" && (
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "#4a7c3f",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Bot size={14} color="white" />
                  </div>
                )}

                {/* Bubble */}
                <div style={{
                  maxWidth: "78%",
                  background: msg.role === "user" ? "#4a7c3f" : "white",
                  color: msg.role === "user" ? "white" : "#1f2d1c",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "9px 13px",
                  fontSize: 13,
                  lineHeight: 1.55,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  whiteSpace: "pre-line",
                }}>
                  {msg.isStreaming && msg.content === "" ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
                      {[0, 150, 300].map((d) => (
                        <span key={d} style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#4a7c3f",
                          display: "inline-block",
                          animation: `bounce 1.2s ${d}ms ease-in-out infinite`,
                        }} />
                      ))}
                    </div>
                  ) : (
                    <>
                      {renderContent(msg.content)}
                      {msg.isStreaming && <Cursor />}
                    </>
                  )}
                </div>
              </div>

              {/* Product suggestion cards */}
              {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                <div style={{ marginTop: 8, marginLeft: 33, display: "flex", flexDirection: "column", gap: 6 }}>
                  {msg.suggestedProducts.map((p) => (
                    <a
                      key={p.slug}
                      href={p.slug}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "white", border: "1px solid #c5d9c0",
                        borderRadius: 10, padding: "8px 12px",
                        textDecoration: "none", gap: 8,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        transition: "box-shadow 0.2s",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#1f2d1c", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {p.price && <span style={{ fontSize: 11, color: "#4a7c3f", fontWeight: 600 }}>{p.price}</span>}
                        <span style={{
                          background: "#4a7c3f", color: "white",
                          fontSize: 10, padding: "3px 8px", borderRadius: 6,
                          display: "flex", alignItems: "center", gap: 3,
                        }}>
                          <ShoppingBag size={10} /> Xem
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Quick reply chips — chỉ hiện sau tin nhắn đầu tiên của bot */}
              {i === 0 && msg.role === "assistant" && !isSending && messages.length === 1 && (
                <div style={{ marginTop: 10, marginLeft: 33 }}>
                  <p style={{ fontSize: 11, color: "#7a9272", marginBottom: 6 }}>Câu hỏi thường gặp:</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        style={{
                          fontSize: 11, padding: "5px 11px",
                          background: "white", border: "1px solid #c5d9c0",
                          borderRadius: 99, cursor: "pointer",
                          color: "#2e5c25", fontWeight: 500,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "#e8f2e5"; }}
                        onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "white"; }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT AREA ──────────────────────────── */}
        <div style={{
          background: "white",
          borderTop: "1px solid #e2ead f",
          padding: "10px 12px",
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          flexShrink: 0,
        }}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
            }}
            onKeyDown={handleKey}
            disabled={isSending}
            placeholder="Nhập câu hỏi của bạn..."
            rows={1}
            style={{
              flex: 1, resize: "none", border: "none", outline: "none",
              background: "transparent", fontSize: 13, lineHeight: 1.5,
              color: "#1f2d1c", minHeight: 36, maxHeight: 80,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => sendMessage(message)}
            disabled={isSending || !message.trim()}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: message.trim() && !isSending ? "#4a7c3f" : "#c5d9c0",
              border: "none", cursor: message.trim() && !isSending ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.2s",
            }}
            aria-label="Gửi"
          >
            <Send size={15} color="white" />
          </button>
        </div>

        {/* Link xem shop */}
        <div style={{
          background: "white", paddingBottom: 10, textAlign: "center",
          borderTop: "1px solid #f0f4ee",
        }}>
          <a
            href="/san-pham"
            style={{
              fontSize: 11, color: "#4a7c3f",
              textDecoration: "none", display: "inline-flex",
              alignItems: "center", gap: 4,
            }}
          >
            <ExternalLink size={11} />
            Xem tất cả sản phẩm tại shop
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          FLOATING BUTTON
      ═══════════════════════════════════════ */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        {/* Tooltip */}
        {!open && (
          <div
            onClick={() => setOpen(true)}
            style={{
              background: "#4a7c3f", color: "white",
              fontSize: 11, fontWeight: 500,
              padding: "6px 12px", borderRadius: 99,
              cursor: "pointer", userSelect: "none",
              boxShadow: "0 2px 10px rgba(74,124,63,0.4)",
              animation: "chatPulse 2.5s ease-in-out infinite",
            }}
          >
            Tư vấn AI 24/7 🌿
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Mở hỗ trợ AI"
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #4a7c3f 0%, #2e5c25 100%)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(74,124,63,0.45)",
            transition: "transform 0.2s",
            position: "relative",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          {open
            ? <X size={22} color="white" />
            : <>
              <MessageCircle size={22} color="white" />
              <span style={{
                position: "absolute", top: -2, right: -2,
                width: 12, height: 12, borderRadius: "50%",
                background: "#4ade80", border: "2px solid white",
                animation: "chatPulse 2s ease-in-out infinite",
              }} />
            </>
          }
        </button>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes chatPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.04); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
