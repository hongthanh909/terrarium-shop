"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, X, Maximize2, Minimize2, ExternalLink
} from "lucide-react";

// ── Types ────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "db" | "fallback" | "knowledge";
  isStreaming?: boolean;
  suggestedProducts?: { name: string; slug: string; price: string; image?: string }[];
}

interface PageContext {
  type: "product" | "blog" | "explore" | "checkout" | "orders" | "consult" | "home" | "general";
  slug?: string;
  productName?: string;
  productPrice?: string;
  categoryName?: string;
  blogTitle?: string;
}

// ── Quick Questions per page ─────────────────────────
const QUICK_QUESTIONS: Record<string, string[]> = {
  product: [
    "Cách chăm sóc sản phẩm này?",
    "Có sản phẩm tương tự không?",
    "Mua kèm phụ kiện gì?",
  ],
  blog: [
    "Hướng dẫn chăm sóc Rêu Nhung",
    "Terrarium hệ kín",
    "Thiết kế theo yêu cầu",
  ],
  explore: [
    "Sản phẩm nào đang hot?",
    "Gợi ý quà tặng dưới 500k?",
    "Terrarium cho người mới?",
  ],
  checkout: [
    "Chính sách vận chuyển?",
    "Bao lâu thì nhận hàng?",
    "Đổi trả thế nào?",
  ],
  general: [
    "Hướng dẫn chăm sóc Rêu Nhung",
    "Terrarium hệ kín",
    "Thiết kế theo yêu cầu",
  ],
};

// ── Helpers ──────────────────────────────────────────
function extractProductLinks(text: string): { name: string; slug: string; price: string; image?: string }[] {
  const products: { name: string; slug: string; price: string; image?: string }[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/Link:\s*(\/products\/[\w-]+)/);
    if (linkMatch) {
      const slug = linkMatch[1];
      const nameMatch = line.match(/^[-•]\s*([^\[⭐]+)/);
      const imageMatch = line.match(/Image:\s*(https?:\/\/[^\s]+)/);
      const imageUrl = imageMatch ? imageMatch[1] : undefined;
      const priceMatch = line.match(/—\s*([\d.,]+₫[^|—]*)/);
      if (nameMatch) {
        products.push({
          name: nameMatch[1].replace("⭐", "").trim(),
          slug,
          price: priceMatch ? priceMatch[1].trim() : "",
          image: imageUrl,
        });
      }
    }
  }
  return products.slice(0, 3);
}

function renderContent(content: string) {
  const cleaned = content.replace(/\s*\|\s*Link:\s*\/products\/[\w-]+/g, "").replace(/\s*\|\s*Image:\s*https?:\/\/[^\s]+/g, "");
  return cleaned.split("\n").map((line, i) => (
    <span key={i} className="block">
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
          : <span key={j}>{part}</span>
      )}
    </span>
  ));
}

function getPageContext(pathname: string): PageContext {
  if (pathname.match(/^\/products\/[\w-]+$/)) {
    return { type: "product", slug: pathname.replace("/products/", "") };
  }
  if (pathname.startsWith("/blog")) return { type: "blog" };
  if (pathname === "/explore") return { type: "explore" };
  if (pathname.startsWith("/checkout")) return { type: "checkout" };
  if (pathname.startsWith("/orders")) return { type: "orders" };
  if (pathname === "/consult") return { type: "consult" };
  if (pathname === "/") return { type: "home" };
  return { type: "general" };
}

function getWelcomeMessage(ctx: PageContext): string {
  switch (ctx.type) {
    case "product":
      if (ctx.productName) {
        return `Chào bạn! Bạn đang xem **${ctx.productName}**${ctx.productPrice ? ` (${ctx.productPrice})` : ""}.\nHỏi mình bất cứ điều gì về sản phẩm này nhé.`;
      }
      return "Chào bạn! Mình là trợ lý của Tiệm Rêu.\nBạn đang xem chi tiết sản phẩm, hỏi mình nhé!";
    case "blog":
      return "Chào bạn! Mình có thể giúp bạn tìm sản phẩm liên quan hoặc tư vấn chăm sóc terrarium.";
    case "explore":
      return "Chào bạn! Mình có thể gợi ý sản phẩm phù hợp hoặc so sánh các lựa chọn cho bạn.";
    case "checkout":
      return "Chào bạn! Mình hỗ trợ thông tin vận chuyển, mã giảm giá và chính sách đổi trả.";
    case "orders":
      return "Chào bạn! Mình hỗ trợ kiểm tra đơn hàng và chính sách đổi trả, bảo hành.";
    default:
      return "Cảm ơn Quý khách! Em sẽ hỗ trợ ngay để bạn có một không gian xanh ưng ý nhất.";
  }
}

// ── Constants ────────────────────────────────────────
const MAX_MESSAGES_PER_SESSION = 30;
const SEND_COOLDOWN_MS = 3000;
const MAX_INPUT_LENGTH = 400;

// ── Palette (from Figma mockup) ──────────────────────
const P = {
  mossDeep: "#2F4A3C",
  emerald: "#34A267",
  beige: "#EDE7DA",
  studio: "#F4F2ED",
  text: "#2B2B28",
  white: "#FFFFFF",
  border: "#E3E0D8",
  muted: "#9B9890",
  inputBg: "#F8F7F4",
};

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════
export default function ChatWidget() {
  const pathname = usePathname() ?? "";

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Drag state ─────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [fabPos, setFabPos] = useState({ x: 0, y: 0 }); // offset from default position
  const fabRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: fabPos.x,
      origY: fabPos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [fabPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      setIsDragging(true);
    }
    setFabPos({
      x: dragRef.current.origX + dx,
      y: dragRef.current.origY + dy,
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) {
      setOpen(prev => !prev);
    }
    setTimeout(() => setIsDragging(false), 50);
    dragRef.current = null;
  }, [isDragging]);

  // ── Page context ───────────────────────────────
  const [pageCtx, setPageCtx] = useState<PageContext>(() => getPageContext(pathname));
  const [productData, setProductData] = useState<{ name: string; price: string; category: string } | null>(null);

  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      const ctx = getPageContext(pathname);
      setPageCtx(ctx);
      setProductData(null);
      if (ctx.type === "product" && ctx.slug) {
        fetch(`/api/products?slug=${ctx.slug}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              const price = data.salePrice
                ? `${Number(data.salePrice).toLocaleString("vi-VN")}₫`
                : `${Number(data.basePrice).toLocaleString("vi-VN")}₫`;
              setProductData({ name: data.name, price, category: data.category?.name || "" });
            }
          })
          .catch(() => {});
      }
    }
  }, [pathname]);

  const enrichedCtx = useMemo<PageContext>(() => {
    if (pageCtx.type === "product" && productData) {
      return { ...pageCtx, productName: productData.name, productPrice: productData.price, categoryName: productData.category };
    }
    return pageCtx;
  }, [pageCtx, productData]);

  const initialMessage = useMemo<ChatMessage>(() => ({
    role: "assistant",
    content: getWelcomeMessage(enrichedCtx),
  }), [enrichedCtx]);

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);

  const prevWelcomeRef = useRef(initialMessage.content);
  useEffect(() => {
    if (initialMessage.content !== prevWelcomeRef.current) {
      prevWelcomeRef.current = initialMessage.content;
      setMessages([initialMessage]);
      setIsAIAvailable(null);
    }
  }, [initialMessage]);

  const messageCount = messages.filter(m => m.role === "user").length;
  const quickQs = QUICK_QUESTIONS[enrichedCtx.type] || QUICK_QUESTIONS.general;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  const resetChat = () => {
    abortControllerRef.current?.abort();
    setMessages([initialMessage]);
    setMessage("");
    setIsSending(false);
    setIsCooldown(false);
    setIsAIAvailable(null);
  };

  // ── Send message ───────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending || isCooldown) return;

    if (messageCount >= MAX_MESSAGES_PER_SESSION) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Cuộc trò chuyện đã khá dài rồi. Để được tư vấn chi tiết hơn, liên hệ trực tiếp qua Zalo hoặc Facebook của Tiệm Rêu nhé!\n\nHoặc bấm nút làm mới để bắt đầu lại.",
        isStreaming: false,
      }]);
      return;
    }

    const userMsg = text.trim();
    if (userMsg.length > MAX_INPUT_LENGTH) return;
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
        body: JSON.stringify({ message: userMsg, history: history.slice(0, -1), pageContext: enrichedCtx }),
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
            } catch {}
          }
        }

        const suggestedProducts = extractProductLinks(fullContent);
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = { role: "assistant", content: fullContent || "Xin lỗi, mình chưa thể trả lời.", source: "ai", isStreaming: false, suggestedProducts };
          return u;
        });
      } else {
        const data = await res.json();
        if (data.source === "fallback") {
          setIsAIAvailable(false);
        } else if (data.source === "knowledge" || data.source === "db") {
          if (isAIAvailable === null) setIsAIAvailable(true);
        }
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = { role: "assistant", content: data.response || "Xin lỗi, mình chưa hiểu.", source: data.source, isStreaming: false };
          return u;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = { role: "assistant", content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!", isStreaming: false };
        return u;
      });
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), SEND_COOLDOWN_MS);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(message); }
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return (
    <>
      {/* ── CSS ─────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .cw-panel {
          width: calc(100vw - 32px);
          max-width: 400px;
          height: calc(100dvh - 120px);
          max-height: 580px;
        }
        .cw-panel.cw-expanded {
          max-width: 520px;
          max-height: 720px;
        }
        @media (min-width: 640px) {
          .cw-panel { width: 400px; height: 560px; max-height: 560px; }
          .cw-panel.cw-expanded { width: 520px; height: 720px; max-height: 720px; }
        }
        .cw-scrollbar::-webkit-scrollbar { width: 3px; }
        .cw-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .cw-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(47,74,60,0.12); border-radius: 99px;
        }
        .cw-input::placeholder { color: ${P.muted}; }
        .cw-chip {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cw-chip:hover {
          background: ${P.mossDeep} !important;
          color: white !important;
          border-color: ${P.mossDeep} !important;
          transform: translateY(-1px);
        }
        .cw-chip:active { transform: translateY(0) scale(0.97); }
        .cw-product-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cw-product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(47,74,60,0.1);
          border-color: ${P.emerald}40;
        }
        @keyframes cw-typing {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes cw-bubble-nudge {
          0%, 92%, 100% { transform: translateY(0); }
          95% { transform: translateY(-6px); }
          97% { transform: translateY(0); }
        }
        @keyframes cw-pulse-soft {
          0% { box-shadow: 0 4px 20px rgba(47,74,60,0.3); }
          50% { box-shadow: 0 4px 28px rgba(52,162,103,0.4); }
          100% { box-shadow: 0 4px 20px rgba(47,74,60,0.3); }
        }
        .cw-bubble-idle {
          animation: cw-bubble-nudge 8s ease-in-out infinite, cw-pulse-soft 4s ease-in-out infinite;
        }
        .cw-bubble-idle:hover {
          animation: none;
          transform: scale(1.06);
          box-shadow: 0 6px 32px rgba(47,74,60,0.45);
        }
      `}</style>

      {/* ═══ CHAT PANEL ═══════════════════════════ */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={`fixed z-[9998] cw-panel flex flex-col ${expanded ? "cw-expanded" : ""}`}
            style={{
              bottom: 100 - fabPos.y,
              right: 16 - fabPos.x,
              borderRadius: 20,
              overflow: "hidden",
              background: P.white,
              boxShadow: "0 16px 64px rgba(47,74,60,0.14), 0 0 0 1px rgba(47,74,60,0.05)",
            }}
          >
            {/* ── HEADER ──────────────────────────── */}
            <div
              className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
              style={{ background: P.white, borderBottom: `1px solid ${P.border}` }}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: P.mossDeep }}
              >
                <span
                  className="text-white text-[8px] leading-tight text-center select-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, letterSpacing: "0.02em" }}
                >
                  tiệm<br />Rêu Décor
                </span>
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <span
                  className="block text-sm font-semibold"
                  style={{ color: P.text, fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}
                >
                  Tiệm Rêu Decor
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-[6px] h-[6px] rounded-full"
                    style={{ background: P.emerald }}
                  />
                  <span className="text-[11px]" style={{ color: P.muted }}>
                    Trợ lý cảnh quan AI
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setExpanded(!expanded)}
                  title={expanded ? "Thu nhỏ" : "Mở rộng"}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                  style={{ border: "none", cursor: "pointer", color: P.muted }}
                >
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Đóng"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                  style={{ border: "none", cursor: "pointer", color: P.muted }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── MESSAGES ─────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto cw-scrollbar flex flex-col gap-4 px-4 py-4"
              style={{ background: P.studio }}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30, delay: i === messages.length - 1 ? 0.05 : 0 }}
                >
                  {msg.role === "user" ? (
                    /* ── User message: beige bubble, right ── */
                    <div className="flex justify-end">
                      <div
                        className="max-w-[78%] text-[13.5px] leading-relaxed"
                        style={{
                          background: P.beige,
                          color: P.text,
                          borderRadius: "18px 18px 4px 18px",
                          padding: "10px 16px",
                        }}
                      >
                        {renderContent(msg.content)}
                      </div>
                    </div>
                  ) : (
                    /* ── AI message: plain text, no bubble ── */
                    <div className="flex items-start gap-0">
                      <div
                        className="max-w-[90%] text-[13.5px] leading-[1.7]"
                        style={{
                          color: P.text,
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 15,
                          padding: "2px 4px",
                        }}
                      >
                        {msg.isStreaming && msg.content === "" ? (
                          <div className="flex gap-1.5 items-center py-2">
                            {[0, 1, 2].map((d) => (
                              <span
                                key={d}
                                className="w-[5px] h-[5px] rounded-full"
                                style={{
                                  background: P.emerald,
                                  animation: `cw-typing 1.4s ${d * 0.16}s ease-in-out infinite`,
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <>
                            {renderContent(msg.content)}
                            {msg.isStreaming && (
                              <span
                                className="inline-block w-[2px] h-3.5 ml-0.5 align-middle rounded-full animate-pulse"
                                style={{ background: P.emerald }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Product cards */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2">
                      {msg.suggestedProducts.map((p) => (
                        <a
                          key={p.slug}
                          href={p.slug}
                          className="cw-product-card flex items-center gap-3 no-underline"
                          style={{
                            background: P.white,
                            border: `1px solid ${P.border}`,
                            borderRadius: 14,
                            padding: "10px 14px",
                          }}
                        >
                          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ background: P.studio }}>
                            <img src={p.image || "/placeholder.png"} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-medium truncate" style={{ color: P.text }}>{p.name}</span>
                            {p.price && (
                              <span className="text-[11px] font-semibold" style={{ color: P.mossDeep }}>{p.price}</span>
                            )}
                          </div>
                          <span
                            className="flex items-center gap-1 text-[10px] font-medium text-white px-2.5 py-1 rounded-lg flex-shrink-0"
                            style={{ background: P.mossDeep }}
                          >
                            Xem chi tiết
                          </span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Quick chips after first message only */}
                  {i === 0 && msg.role === "assistant" && !isSending && messages.length === 1 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickQs.map((q, qi) => (
                        <motion.button
                          key={q}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + qi * 0.06, type: "spring", stiffness: 400, damping: 28 }}
                          onClick={() => sendMessage(q)}
                          className="cw-chip text-[12px] font-medium cursor-pointer"
                          style={{
                            padding: "7px 14px",
                            background: P.white,
                            border: `1px solid ${P.border}`,
                            borderRadius: 99,
                            color: P.text,
                          }}
                        >
                          {q}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT AREA ──────────────────────── */}
            <div
              className="flex-shrink-0 px-3 py-2.5"
              style={{ borderTop: `1px solid ${P.border}`, background: P.white }}
            >
              <div
                className="flex items-end gap-2 rounded-2xl px-3.5 py-2"
                style={{ background: P.inputBg, border: `1px solid ${P.border}` }}
              >
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= MAX_INPUT_LENGTH) setMessage(val);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
                    }}
                    onKeyDown={handleKey}
                    disabled={isSending || isCooldown || messageCount >= MAX_MESSAGES_PER_SESSION}
                    placeholder={isCooldown ? "Đợi chút..." : messageCount >= MAX_MESSAGES_PER_SESSION ? "Đã đạt giới hạn" : "Nhắn tin đến Tiệm Rêu..."}
                    rows={1}
                    className="cw-input w-full resize-none border-none outline-none bg-transparent text-[13px] leading-relaxed font-[inherit]"
                    style={{ minHeight: 32, maxHeight: 80, boxShadow: "none", color: P.text }}
                  />
                  {message.length > 300 && (
                    <span
                      className="absolute right-0 bottom-0 text-[10px] font-semibold"
                      style={{ color: message.length >= MAX_INPUT_LENGTH ? "#dc2626" : P.muted }}
                    >
                      {message.length}/{MAX_INPUT_LENGTH}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => sendMessage(message)}
                  disabled={isSending || isCooldown || !message.trim() || messageCount >= MAX_MESSAGES_PER_SESSION}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: message.trim() && !isSending && !isCooldown ? P.mossDeep : P.border,
                    border: "none",
                    cursor: message.trim() && !isSending && !isCooldown ? "pointer" : "default",
                  }}
                  aria-label="Gửi"
                >
                  <Send size={14} color="white" />
                </button>
              </div>

              {/* Bottom link */}
              <div className="text-center pt-2 pb-0.5">
                <a
                  href="/products"
                  className="inline-flex items-center gap-1 text-[11px] font-medium no-underline transition-colors hover:text-[#2F4A3C]"
                  style={{ color: P.muted }}
                >
                  <ExternalLink size={10} />
                  Xem sản phẩm
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ FLOATING BUBBLE ═════════════════════ */}
      <div
        ref={fabRef}
        className="fixed z-[9999] select-none"
        style={{
          bottom: 20,
          right: 16,
          transform: `translate(${-fabPos.x}px, ${-fabPos.y}px)`,
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-2">
          {/* Tooltip when closed */}
          <AnimatePresence>
            {!open && !isDragging && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full cursor-pointer whitespace-nowrap"
                style={{
                  background: P.white,
                  color: P.text,
                  boxShadow: "0 2px 12px rgba(47,74,60,0.12), 0 0 0 1px rgba(47,74,60,0.06)",
                }}
                onClick={() => setOpen(true)}
              >
                Tư vấn 24/7
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bubble */}
          <div
            className={`relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform ${!open && !isDragging ? "cw-bubble-idle" : ""}`}
            style={{
              background: P.mossDeep,
              boxShadow: "0 4px 20px rgba(47,74,60,0.35)",
            }}
          >
            {open ? (
              <X size={20} color="white" />
            ) : (
              <>
                <span
                  className="text-white text-[7px] leading-tight text-center select-none pointer-events-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, letterSpacing: "0.02em" }}
                >
                  tiệm Rêu<br />Décor
                </span>
                {/* Status dot */}
                <span
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                  style={{ background: P.emerald, border: "2px solid white" }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
