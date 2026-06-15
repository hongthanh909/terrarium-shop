"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Send, X,
  ShoppingBag, ExternalLink, RefreshCw, Leaf, Sparkles
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
    "Sản phẩm này phù hợp phòng nào?",
    "Cách chăm sóc sản phẩm này?",
    "Có sản phẩm tương tự không?",
    "Mua kèm phụ kiện gì?",
  ],
  blog: [
    "Cách chăm sóc terrarium?",
    "Sản phẩm phù hợp cho phòng tối?",
    "Chính sách vận chuyển?",
    "Terrarium cho người mới?",
  ],
  explore: [
    "Sản phẩm nào đang hot?",
    "Gợi ý quà tặng dưới 500k?",
    "Sản phẩm nào mới nhất?",
    "Terrarium cho người mới?",
  ],
  checkout: [
    "Chính sách vận chuyển?",
    "Có mã giảm giá nào không?",
    "Bao lâu thì nhận hàng?",
    "Đổi trả thế nào?",
  ],
  general: [
    "Cách chăm sóc terrarium?",
    "Sản phẩm phù hợp phòng tối?",
    "Chính sách vận chuyển?",
    "Terrarium cho người mới?",
  ],
};

// ── Helpers (unchanged logic) ────────────────────────
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
        return `Xin chào! Bạn đang xem **${ctx.productName}**${ctx.productPrice ? ` (${ctx.productPrice})` : ""}.\nHỏi tôi bất cứ điều gì về sản phẩm này nhé:\n• Chăm sóc & bảo hành\n• Sản phẩm tương tự\n• Gợi ý mua kèm phụ kiện`;
      }
      return "Xin chào! Tôi là trợ lý của **Tiệm Rêu**.\nBạn đang xem chi tiết sản phẩm — hỏi tôi nhé!";
    case "blog":
      return "Xin chào! Tôi là trợ lý của **Tiệm Rêu**.\nBạn đang đọc blog — tôi có thể giúp bạn:\n• Tìm kiếm sản phẩm liên quan\n• Tư vấn chăm sóc terrarium\n• Giải đáp thắc mắc";
    case "explore":
      return "Xin chào! Tôi là trợ lý của **Tiệm Rêu**.\nBạn đang khám phá bộ sưu tập — tôi có thể giúp:\n• Gợi ý sản phẩm phù hợp với bạn\n• So sánh các sản phẩm\n• Tư vấn quà tặng";
    case "checkout":
      return "Xin chào! Bạn đang thanh toán.\nTôi có thể giúp bạn:\n• Thông tin vận chuyển & giao hàng\n• Hỗ trợ mã giảm giá\n• Chính sách đổi trả";
    case "orders":
      return "Xin chào! Bạn đang xem đơn hàng.\nTôi có thể giúp bạn:\n• Kiểm tra tình trạng đơn hàng\n• Chính sách đổi trả & bảo hành\n• Hỗ trợ liên hệ shop";
    case "home":
      return "Xin chào! Tôi là trợ lý của **Tiệm Rêu**.\nTôi có thể giúp bạn:\n• Tư vấn chọn terrarium phù hợp\n• Hướng dẫn chăm sóc cây\n• Gợi ý sản phẩm và giá cả";
    default:
      return "Xin chào! Tôi là trợ lý của **Tiệm Rêu**.\nTôi có thể giúp bạn:\n• Tư vấn chọn terrarium phù hợp\n• Hướng dẫn chăm sóc cây\n• Gợi ý sản phẩm và giá cả";
  }
}

// ── Constants ────────────────────────────────────────
const MAX_MESSAGES_PER_SESSION = 30;
const SEND_COOLDOWN_MS = 3000;
const MAX_INPUT_LENGTH = 400;

// ── Motion variants ─────────────────────────────────
const panelVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 340, damping: 28 },
  },
  exit: {
    opacity: 0, y: 12, scale: 0.96,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

const msgVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

const chipVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.08 * i, type: "spring", stiffness: 400, damping: 28 },
  }),
};

const tooltipVariants = {
  hidden: { opacity: 0, x: 10, scale: 0.9 },
  visible: {
    opacity: 1, x: 0, scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  exit: { opacity: 0, x: 10, scale: 0.9, transition: { duration: 0.15 } },
};

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════
export default function ChatWidget() {
  const pathname = usePathname() ?? "";

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
              const product = data;
              const price = product.salePrice
                ? `${Number(product.salePrice).toLocaleString("vi-VN")}₫`
                : `${Number(product.basePrice).toLocaleString("vi-VN")}₫`;
              setProductData({
                name: product.name,
                price,
                category: product.category?.name || "",
              });
            }
          })
          .catch(() => { /* silent */ });
      }
    }
  }, [pathname]);

  const enrichedCtx = useMemo<PageContext>(() => {
    if (pageCtx.type === "product" && productData) {
      return {
        ...pageCtx,
        productName: productData.name,
        productPrice: productData.price,
        categoryName: productData.category,
      };
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

  // ── Send message (unchanged logic) ─────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending || isCooldown) return;

    if (messageCount >= MAX_MESSAGES_PER_SESSION) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Dạ cuộc trò chuyện đã khá dài rồi. Để được tư vấn chi tiết hơn, anh/chị liên hệ trực tiếp qua Zalo hoặc Facebook của Tiệm Rêu nhé!\n\nHoặc bấm nút làm mới để bắt đầu cuộc trò chuyện mới.",
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
        body: JSON.stringify({
          message: userMsg,
          history: history.slice(0, -1),
          pageContext: enrichedCtx,
        }),
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
        // knowledge & db are smart responses — not "basic mode"
        if (data.source === "fallback") {
          setIsAIAvailable(false);
        } else if (data.source === "knowledge" || data.source === "db") {
          // Keep current status — don't mark as basic
          if (isAIAvailable === null) setIsAIAvailable(true);
        }
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

  const tooltipLabel = enrichedCtx.type === "product" && enrichedCtx.productName
    ? `Hỏi về ${enrichedCtx.productName.length > 15 ? enrichedCtx.productName.slice(0, 15) + "…" : enrichedCtx.productName}`
    : "Tư vấn AI 24/7";

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return (
    <>
      {/* ── CSS ─────────────────────────────────── */}
      <style>{`
        .cw-panel {
          width: calc(100vw - 32px);
          max-width: 400px;
          height: calc(100dvh - 140px);
          max-height: 560px;
        }
        @media (min-width: 640px) {
          .cw-panel { width: 390px; height: 530px; max-height: 530px; }
        }
        .cw-scrollbar::-webkit-scrollbar { width: 4px; }
        .cw-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .cw-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(66,87,51,0.15); border-radius: 99px;
        }
        .cw-input::placeholder { color: #9aab93; }
        .cw-chip {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cw-chip:hover {
          background: #425733 !important;
          color: white !important;
          border-color: #425733 !important;
          transform: translateY(-1px);
          box-shadow: 0 3px 12px rgba(66,87,51,0.2);
        }
        .cw-chip:active { transform: translateY(0) scale(0.97); }
        .cw-product-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cw-product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(66,87,51,0.12);
          border-color: #b8d8b8;
        }
        .cw-action-btn {
          transition: all 0.2s ease;
        }
        .cw-action-btn:hover {
          background: rgba(255,255,255,0.2);
          transform: scale(1.08);
        }
        .cw-send-btn {
          transition: all 0.2s ease;
        }
        .cw-send-btn:not(:disabled):hover {
          transform: scale(1.08);
          box-shadow: 0 3px 12px rgba(66,87,51,0.35);
        }
        .cw-send-btn:not(:disabled):active {
          transform: scale(0.95);
        }
        .cw-fab {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cw-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 28px rgba(66,87,51,0.5);
        }
        .cw-fab:active { transform: scale(0.95); }
        @keyframes cw-typing {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes cw-pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* ═══ CHAT PANEL ═══════════════════════════ */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed z-[9998] cw-panel flex flex-col"
            style={{
              bottom: 92,
              right: 16,
              borderRadius: 20,
              overflow: "hidden",
              background: "#ffffff",
              boxShadow: "0 12px 48px rgba(26,46,18,0.12), 0 2px 8px rgba(66,87,51,0.08)",
              border: "1px solid rgba(227,235,221,0.6)",
            }}
          >
            {/* ── HEADER ──────────────────────────── */}
            <div
              className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
              style={{
                background: "linear-gradient(135deg, #425733 0%, #2d3d23 100%)",
              }}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <Leaf size={20} color="white" strokeWidth={1.8} />
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">Trợ lý Tiệm Rêu</span>
                  {isAIAvailable === true && (
                    <span
                      className="flex items-center gap-1 text-[10px] text-white/90 px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(143,186,111,0.3)" }}
                    >
                      <Sparkles size={9} /> AI
                    </span>
                  )}
                  {isAIAvailable === false && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(251,191,36,0.25)", color: "#fde68a" }}
                    >
                      Cơ bản
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-[6px] h-[6px] rounded-full"
                    style={{
                      background: isAIAvailable === true ? "#4ade80" : isAIAvailable === false ? "#fbbf24" : "#a3c49a",
                      boxShadow: isAIAvailable === true ? "0 0 0 3px rgba(74,222,128,0.25)" : "none",
                    }}
                  />
                  <span className="text-[11px] text-white/60">
                    {isAIAvailable === true ? "AI đang hoạt động" : isAIAvailable === false ? "Chế độ cơ bản" : "Đang hoạt động"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <a
                  href="/products"
                  title="Xem sản phẩm"
                  className="cw-action-btn w-8 h-8 rounded-lg flex items-center justify-center text-white/80"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <ShoppingBag size={14} />
                </a>
                <button
                  onClick={resetChat}
                  title="Làm mới"
                  className="cw-action-btn w-8 h-8 rounded-lg flex items-center justify-center text-white/80"
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer" }}
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Đóng"
                  className="cw-action-btn w-8 h-8 rounded-lg flex items-center justify-center text-white/80"
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── MESSAGES ─────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto cw-scrollbar flex flex-col gap-3 px-3.5 py-3.5"
              style={{ background: "#fafbf8" }}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  variants={msgVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div
                    className="flex items-end gap-2"
                    style={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
                  >
                    {/* Bot avatar */}
                    {msg.role === "assistant" && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg, #425733, #5a7a45)",
                          boxShadow: "0 2px 6px rgba(66,87,51,0.2)",
                        }}
                      >
                        <Leaf size={13} color="white" strokeWidth={2} />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className="max-w-[80%]"
                      style={{
                        background: msg.role === "user"
                          ? "linear-gradient(135deg, #3a5229 0%, #4a6a35 100%)"
                          : "#ffffff",
                        color: msg.role === "user" ? "white" : "#2c3e24",
                        borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        padding: "10px 14px",
                        fontSize: 13,
                        lineHeight: 1.6,
                        boxShadow: msg.role === "user"
                          ? "0 2px 8px rgba(58,82,41,0.25)"
                          : "0 1px 4px rgba(66,87,51,0.06), 0 0 0 1px rgba(227,235,221,0.5)",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {msg.isStreaming && msg.content === "" ? (
                        <div className="flex gap-1 items-center py-1 px-1">
                          {[0, 1, 2].map((d) => (
                            <span
                              key={d}
                              className="w-[5px] h-[5px] rounded-full"
                              style={{
                                background: "#8fba6f",
                                animation: `cw-typing 1.4s ${d * 0.16}s ease-in-out infinite`,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <>
                          {renderContent(msg.content)}
                          {msg.isStreaming && (
                            <span className="inline-block w-[2px] h-3.5 bg-[#8fba6f] ml-0.5 align-middle rounded-full animate-pulse" />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Product suggestion cards */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-2 ml-9 flex flex-col gap-2">
                      {msg.suggestedProducts.map((p) => (
                        <a
                          key={p.slug}
                          href={p.slug}
                          className="cw-product-card flex items-center gap-3 no-underline"
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e3ebdd",
                            borderRadius: 14,
                            padding: "8px 12px",
                            boxShadow: "0 1px 4px rgba(66,87,51,0.05)",
                          }}
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                            style={{ background: "#f2f8f2" }}
                          >
                            <img src={p.image || "/placeholder.png"} alt={p.name}
                              className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-medium text-[#2c3e24] truncate">
                              {p.name}
                            </span>
                            {p.price && (
                              <span className="text-[11px] font-semibold text-[#425733]">{p.price}</span>
                            )}
                          </div>
                          <span
                            className="flex items-center gap-1 text-[10px] font-medium text-white px-2.5 py-1 rounded-lg flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #3a5229, #4a6a35)" }}
                          >
                            <ShoppingBag size={10} /> Xem
                          </span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Quick reply chips */}
                  {i === 0 && msg.role === "assistant" && !isSending && messages.length === 1 && (
                    <div className="mt-3 ml-9">
                      <p className="text-[11px] text-[#8aa480] mb-2 font-medium">Gợi ý cho bạn</p>
                      <div className="flex flex-wrap gap-1.5">
                        {quickQs.map((q, qi) => (
                          <motion.button
                            key={q}
                            custom={qi}
                            variants={chipVariants}
                            initial="hidden"
                            animate="visible"
                            onClick={() => sendMessage(q)}
                            className="cw-chip text-[11px] font-medium cursor-pointer"
                            style={{
                              padding: "6px 12px",
                              background: "#f2f8f2",
                              border: "1px solid #dbe6d6",
                              borderRadius: 99,
                              color: "#425733",
                            }}
                          >
                            {q}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT AREA ──────────────────────── */}
            <div
              className="flex-shrink-0 px-3 py-2.5"
              style={{ borderTop: "1px solid #e8efe3", background: "#ffffff" }}
            >
              <div
                className="flex items-end gap-2 rounded-2xl px-3.5 py-2"
                style={{ background: "#f5f8f3", border: "1px solid #e3ebdd" }}
              >
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= MAX_INPUT_LENGTH) {
                        setMessage(val);
                      }
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
                    }}
                    onKeyDown={handleKey}
                    disabled={isSending || isCooldown || messageCount >= MAX_MESSAGES_PER_SESSION}
                    placeholder={isCooldown ? "Đợi chút..." : messageCount >= MAX_MESSAGES_PER_SESSION ? "Đã đạt giới hạn" : "Nhập câu hỏi..."}
                    rows={1}
                    className="cw-input w-full resize-none border-none outline-none bg-transparent text-[13px] leading-relaxed text-[#2c3e24] font-[inherit]"
                    style={{ minHeight: 32, maxHeight: 80, boxShadow: "none" }}
                  />
                  {message.length > 300 && (
                    <span
                      className="absolute right-0 bottom-0 text-[10px] font-semibold"
                      style={{ color: message.length >= MAX_INPUT_LENGTH ? "#dc2626" : "#9ca3af" }}
                    >
                      {message.length}/{MAX_INPUT_LENGTH}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => sendMessage(message)}
                  disabled={isSending || isCooldown || !message.trim() || messageCount >= MAX_MESSAGES_PER_SESSION}
                  className="cw-send-btn w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: message.trim() && !isSending && !isCooldown
                      ? "linear-gradient(135deg, #3a5229 0%, #4a6a35 100%)"
                      : "#c5d9c0",
                    border: "none",
                    cursor: message.trim() && !isSending && !isCooldown ? "pointer" : "default",
                  }}
                  aria-label="Gửi"
                >
                  <Send size={14} color="white" />
                </button>
              </div>

              {/* Shop link */}
              <div className="text-center pt-2 pb-0.5">
                <a
                  href="/products"
                  className="inline-flex items-center gap-1 text-[11px] font-medium no-underline"
                  style={{ color: "#8aa480" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#425733"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#8aa480"; }}
                >
                  <ExternalLink size={10} />
                  Xem tất cả sản phẩm
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ FLOATING BUTTON ═════════════════════ */}
      <div className="fixed z-[9999] flex flex-col items-end gap-2" style={{ bottom: 20, right: 16 }}>
        {/* Tooltip */}
        <AnimatePresence>
          {!open && (
            <motion.div
              variants={tooltipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setOpen(true)}
              className="cursor-pointer select-none"
              style={{
                background: "linear-gradient(135deg, #425733 0%, #2d3d23 100%)",
                color: "white",
                fontSize: 11,
                fontWeight: 500,
                padding: "7px 14px",
                borderRadius: 99,
                boxShadow: "0 3px 14px rgba(66,87,51,0.35)",
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {tooltipLabel}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Mở hỗ trợ AI"
          className="cw-fab relative w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #425733 0%, #2d3d23 100%)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(66,87,51,0.4)",
          }}
        >
          {open ? (
            <X size={22} color="white" />
          ) : (
            <>
              <MessageCircle size={22} color="white" />
              {/* Pulse ring */}
              <span
                className="absolute top-0 right-0 w-3 h-3 rounded-full"
                style={{ background: "#4ade80", border: "2px solid white" }}
              />
              <span
                className="absolute top-0 right-0 w-3 h-3 rounded-full"
                style={{
                  background: "#4ade80",
                  animation: "cw-pulse-ring 2s ease-out infinite",
                }}
              />
            </>
          )}
        </button>
      </div>
    </>
  );
}
