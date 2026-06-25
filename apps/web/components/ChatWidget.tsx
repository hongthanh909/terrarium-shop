"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Maximize2, Minimize2, ExternalLink } from "lucide-react";

// ── Types ────────────────────────────────────────────
interface ProductCard {
  name: string;
  slug: string;
  price: string;
  originalPrice?: string;
  image: string;
  category: string;
  inStock: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "db" | "fallback" | "knowledge";
  isStreaming?: boolean;
  products?: ProductCard[];
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
const QUICK_QUESTIONS: Record<string, { icon: string; text: string }[]> = {
  product: [
    { icon: "🌿", text: "Cách chăm sóc cây này?" },
    { icon: "📐", text: "Size bể phù hợp?" },
    { icon: "💧", text: "Tưới nước bao lâu 1 lần?" },
    { icon: "🪴", text: "Cây nào tương tự?" },
    { icon: "🔆", text: "Cần ánh sáng thế nào?" },
    { icon: "📦", text: "Giao hàng bao lâu?" },
  ],
  blog: [
    { icon: "🌿", text: "Cách chăm sóc terrarium?" },
    { icon: "🏺", text: "Bể kín hay bể mở?" },
    { icon: "💧", text: "Tưới nước đúng cách?" },
    { icon: "🪴", text: "Cây phù hợp cho người mới?" },
    { icon: "🛠️", text: "Tự làm DIY terrarium?" },
    { icon: "🎁", text: "Mua quà tặng nào đẹp?" },
  ],
  explore: [
    { icon: "🔥", text: "Sản phẩm đang hot?" },
    { icon: "💰", text: "Gợi ý dưới 500k?" },
    { icon: "🌱", text: "Terrarium cho người mới?" },
    { icon: "🎁", text: "Ý tưởng quà tặng?" },
    { icon: "🏺", text: "Bể kín hay bể mở?" },
    { icon: "🌿", text: "Cây nào dễ chăm nhất?" },
  ],
  checkout: [
    { icon: "🚚", text: "Ship bao lâu tới nơi?" },
    { icon: "💳", text: "Thanh toán kiểu nào?" },
    { icon: "🔄", text: "Đổi trả thế nào?" },
    { icon: "🎁", text: "Có freeship không?" },
    { icon: "📦", text: "Đóng gói có an toàn?" },
    { icon: "📍", text: "Ship tới tỉnh tôi không?" },
  ],
  home: [
    { icon: "🌿", text: "Cách chăm sóc terrarium?" },
    { icon: "🏺", text: "Bể kín hay bể mở?" },
    { icon: "💰", text: "Gợi ý dưới 500k?" },
    { icon: "💧", text: "Cây bị vàng lá xử lý sao?" },
    { icon: "📦", text: "Chính sách giao hàng?" },
    { icon: "🎁", text: "Mua quà tặng nào đẹp?" },
  ],
  general: [
    { icon: "🌿", text: "Cách chăm sóc terrarium?" },
    { icon: "🏺", text: "Bể kín hay bể mở?" },
    { icon: "💰", text: "Gợi ý dưới 500k?" },
    { icon: "💧", text: "Cây bị vàng lá xử lý sao?" },
    { icon: "📦", text: "Chính sách giao hàng?" },
    { icon: "🎁", text: "Mua quà tặng nào đẹp?" },
  ],
};

// ── Helpers ──────────────────────────────────────────
function extractProductLinks(text: string) {
  const products: { name: string; slug: string; price: string; image?: string }[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/Link:\s*(\/products\/[\w-]+)/);
    if (linkMatch) {
      const slug = linkMatch[1];
      const nameMatch = line.match(/^[-•]\s*([^\[⭐]+)/);
      const imageMatch = line.match(/Image:\s*(https?:\/\/[^\s]+)/);
      const priceMatch = line.match(/—\s*([\d.,]+₫[^|—]*)/);
      if (nameMatch) {
        products.push({
          name: nameMatch[1].replace("⭐", "").trim(),
          slug,
          price: priceMatch ? priceMatch[1].trim() : "",
          image: imageMatch ? imageMatch[1] : undefined,
        });
      }
    }
  }
  return products.slice(0, 3);
}

function renderContent(content: string) {
  const cleaned = content
    .replace(/\s*\|\s*Link:\s*\/products\/[\w-]+/g, "")
    .replace(/\s*\|\s*Image:\s*https?:\/\/[^\s]+/g, "");
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
  if (pathname.match(/^\/products\/[\w-]+$/)) return { type: "product", slug: pathname.replace("/products/", "") };
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
const MAX_MESSAGES = 30;
const COOLDOWN_MS = 3000;
const MAX_INPUT = 400;

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
  const abortRef = useRef<AbortController | null>(null);

  // ── Viewport dimensions ────────────────────────
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── Free drag (absolute position) ──────────────
  const [bubblePos, setBubblePos] = useState<{ right: number; bottom: number }>({ right: 16, bottom: 20 });
  const dragState = useRef<{ dragging: boolean; moved: boolean; startX: number; startY: number; startRight: number; startBottom: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = {
      dragging: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      startRight: bubblePos.right,
      startBottom: bubblePos.bottom,
    };
  }, [bubblePos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds || !ds.dragging) return;
    const dx = ds.startX - e.clientX; // inverted because right-anchored
    const dy = ds.startY - e.clientY; // inverted because bottom-anchored
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) ds.moved = true;
    if (!ds.moved) return;

    // Clamp to viewport
    const newRight = Math.max(0, Math.min(window.innerWidth - 60, ds.startRight + dx));
    const newBottom = Math.max(0, Math.min(window.innerHeight - 60, ds.startBottom + dy));
    setBubblePos({ right: newRight, bottom: newBottom });
  }, []);

  const onPointerUp = useCallback(() => {
    const ds = dragState.current;
    if (ds && !ds.moved) {
      setOpen(prev => !prev);
    }
    dragState.current = null;
  }, []);

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

  const userMsgCount = messages.filter(m => m.role === "user").length;
  const quickQs = QUICK_QUESTIONS[enrichedCtx.type] || QUICK_QUESTIONS.general;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => textareaRef.current?.focus(), 150); }, [open]);
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const resetChat = () => {
    abortRef.current?.abort();
    setMessages([initialMessage]);
    setMessage("");
    setIsSending(false);
    setIsCooldown(false);
    setIsAIAvailable(null);
  };

  // ── Send message ───────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending || isCooldown) return;
    if (userMsgCount >= MAX_MESSAGES) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Cuộc trò chuyện đã khá dài rồi. Liên hệ Zalo hoặc Facebook Tiệm Rêu để được tư vấn chi tiết hơn nhé!\n\nBấm nút làm mới để bắt đầu lại.",
        isStreaming: false,
      }]);
      return;
    }

    const userMsg = text.trim();
    if (userMsg.length > MAX_INPUT) return;
    setMessage("");

    const newMsgs: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMsgs);
    setIsSending(true);

    const history = newMsgs.slice(1).map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: history.slice(0, -1), pageContext: enrichedCtx }),
        signal: controller.signal,
      });

      const ct = res.headers.get("Content-Type") ?? "";

      if (ct.includes("text/event-stream")) {
        setIsAIAvailable(true);
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const d = line.slice(6).trim();
            if (d === "[DONE]") break;
            try {
              const token = JSON.parse(d).token ?? "";
              if (token) {
                full += token;
                setMessages(prev => {
                  const u = [...prev];
                  u[u.length - 1] = { role: "assistant", content: full, source: "ai", isStreaming: true };
                  return u;
                });
              }
            } catch {}
          }
        }

        const sp = extractProductLinks(full);
        setMessages(prev => {
          const u = [...prev];
          u[u.length - 1] = { role: "assistant", content: full || "Xin lỗi, mình chưa thể trả lời.", source: "ai", isStreaming: false, suggestedProducts: sp };
          return u;
        });
      } else {
        const data = await res.json();
        if (data.source === "fallback") setIsAIAvailable(false);
        else if ((data.source === "knowledge" || data.source === "db") && isAIAvailable === null) setIsAIAvailable(true);
        setMessages(prev => {
          const u = [...prev];
          u[u.length - 1] = {
            role: "assistant",
            content: data.response || "Xin lỗi, mình chưa hiểu.",
            source: data.source,
            isStreaming: false,
            products: data.products || undefined,
          };
          return u;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages(prev => {
        const u = [...prev];
        u[u.length - 1] = { role: "assistant", content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!", isStreaming: false };
        return u;
      });
    } finally {
      setIsSending(false);
      abortRef.current = null;
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), COOLDOWN_MS);
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
      <style>{`
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
        .cw-scroll::-webkit-scrollbar { width: 3px; }
        .cw-scroll::-webkit-scrollbar-track { background: transparent; }
        .cw-scroll::-webkit-scrollbar-thumb { background: rgba(66,87,51,0.15); border-radius: 99px; }
        .cw-input::placeholder { color: #8a9e84; }
        .cw-chip {
          transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
        }
        .cw-chip:hover {
          background: #2d4a22 !important;
          color: white !important;
          border-color: #2d4a22 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(45,74,34,0.2);
        }
        .cw-chip:active { transform: translateY(0) scale(0.97); }
        .cw-product-card {
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .cw-product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(66,87,51,0.1);
          border-color: #b8d8b8;
        }
        @keyframes cw-typing {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes cw-nudge {
          0%, 85%, 100% { transform: translateY(0); }
          90% { transform: translateY(-8px); }
          95% { transform: translateY(0); }
        }
        @keyframes cw-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(66,87,51,0.4), 0 4px 20px rgba(66,87,51,0.35); }
          70% { box-shadow: 0 0 0 10px rgba(66,87,51,0), 0 4px 20px rgba(66,87,51,0.35); }
          100% { box-shadow: 0 0 0 0 rgba(66,87,51,0), 0 4px 20px rgba(66,87,51,0.35); }
        }
        .cw-bubble-idle {
          animation: cw-nudge 3.5s ease-in-out infinite, cw-pulse-ring 2.5s ease-out infinite;
        }
        .cw-bubble-idle:hover {
          animation: none;
          transform: scale(1.1);
          box-shadow: 0 8px 28px rgba(45,74,34,0.45) !important;
        }
        @keyframes cw-status-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        .cw-status-dot { animation: cw-status-pulse 2s ease-in-out infinite; }
      `}</style>

      {/* ═══ CHAT PANEL ═══════════════════════════ */}
      <AnimatePresence>
        {open && (() => {
          // ── Smart positioning: panel opens toward side with most space ──
          const BUBBLE_SIZE = 56;
          const GAP = 12;
          const panelW = expanded ? 520 : 400;
          const panelH = expanded ? 700 : 540;
          const safeW = Math.min(panelW, viewport.w - 16);
          const safeH = Math.min(panelH, viewport.h - 16);

          // Bubble center in viewport coords
          const bubbleCX = viewport.w - bubblePos.right - BUBBLE_SIZE / 2;
          const bubbleCY = viewport.h - bubblePos.bottom - BUBBLE_SIZE / 2;

          // Horizontal: open on side with more space
          const pos: React.CSSProperties = {};
          if (bubbleCX > viewport.w / 2) {
            // Bubble on right half → panel right-aligned
            pos.right = Math.max(8, bubblePos.right);
          } else {
            // Bubble on left half → panel left-aligned
            const bubbleLeft = viewport.w - bubblePos.right - BUBBLE_SIZE;
            pos.left = Math.max(8, Math.min(bubbleLeft, viewport.w - safeW - 8));
          }

          // Vertical: open above or below bubble based on available space
          const spaceAbove = viewport.h - bubblePos.bottom - BUBBLE_SIZE;
          const spaceBelow = bubblePos.bottom;
          if (spaceAbove >= safeH + GAP) {
            // Enough space above → open above bubble
            pos.bottom = bubblePos.bottom + BUBBLE_SIZE + GAP;
          } else if (spaceBelow >= safeH + GAP) {
            // Enough space below → open below bubble
            pos.top = viewport.h - bubblePos.bottom + GAP;
          } else {
            // Not enough space either way → clamp to viewport, center vertically
            pos.top = Math.max(8, (viewport.h - safeH) / 2);
          }

          return (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={`fixed z-[9999] cw-panel flex flex-col ${expanded ? "cw-expanded" : ""}`}
            style={{
              ...pos,
              borderRadius: 16,
              overflow: "hidden",
              background: "#ffffff",
              boxShadow: "0 12px 48px rgba(26,46,18,0.12), 0 0 0 1px rgba(227,235,221,0.6)",
            }}
          >
            {/* ── HEADER ──────────────────────────── */}
            <div
              className="flex-shrink-0 flex items-center gap-3 px-4 py-3.5"
              style={{
                background: "linear-gradient(135deg, #1a2f18 0%, #243d20 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Avatar circle — logo trên nền tối */}
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: "1.5px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)" }}
              >
                <img
                  src="/logo.png"
                  alt="Tiệm Rêu Décor Logo"
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-semibold" style={{ color: "#f0f7ee" }}>
                  Tiệm Rêu Décor
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="cw-status-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "#7dba5f" }}
                  />
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Trợ lý AI · Trực tuyến
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-0.5 flex-shrink-0">
                <button
                  onClick={() => setExpanded(!expanded)}
                  title={expanded ? "Thu nhỏ" : "Mở rộng"}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Đóng"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── MESSAGES ─────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto cw-scroll flex flex-col gap-4 px-4 py-4"
              style={{ background: "#fafbf8" }}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div
                        className="max-w-[78%] text-[13px] leading-relaxed"
                        style={{
                          background: "linear-gradient(135deg, #2d4a22, #3a5e2c)",
                          color: "#f0f7ee",
                          borderRadius: "16px 16px 4px 16px",
                          padding: "10px 14px",
                          boxShadow: "0 2px 8px rgba(45,74,34,0.2)",
                        }}
                      >
                        {renderContent(msg.content)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      {/* Bot avatar mini */}
                      <div
                        className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5"
                        style={{ border: "1px solid rgba(66,87,51,0.15)", background: "#f0f5ee" }}
                      >
                        <img src="/logo.png" alt="" className="w-full h-full object-cover" />
                      </div>
                      <div
                        className="max-w-[85%] text-[13px] leading-[1.7] rounded-[4px_16px_16px_16px]"
                        style={{
                          color: "#1e3319",
                          background: "#eef4ea",
                          padding: "10px 13px",
                          border: "1px solid rgba(66,87,51,0.08)",
                        }}
                      >
                        {msg.isStreaming && msg.content === "" ? (
                          <div className="flex gap-1.5 items-center py-1">
                            {[0, 1, 2].map((d) => (
                              <span
                                key={d}
                                className="w-[5px] h-[5px] rounded-full"
                                style={{
                                  background: "#5a8f4a",
                                  animation: `cw-typing 1.4s ${d * 0.18}s ease-in-out infinite`,
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <>
                            {renderContent(msg.content)}
                            {msg.isStreaming && (
                              <span className="inline-block w-[2px] h-3.5 ml-0.5 align-middle rounded-full animate-pulse" style={{ background: "#5a8f4a" }} />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Product cards from API */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {msg.products.map((p) => (
                        <a
                          key={p.slug}
                          href={p.slug}
                          className="cw-product-card flex items-center gap-3 no-underline"
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e3ebdd",
                            borderRadius: 14,
                            padding: "10px 12px",
                          }}
                        >
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative" style={{ background: "#f2f8f2" }}>
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-lg">🌿</span>
                              </div>
                            )}
                            {p.originalPrice && (
                              <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-white px-1 py-0.5 rounded" style={{ background: "#e74c3c" }}>SALE</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[12px] font-semibold truncate" style={{ color: "#2c3e24" }}>{p.name}</span>
                            <span className="text-[10px] mt-0.5 block" style={{ color: "#8aa480" }}>{p.category}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[12px] font-bold" style={{ color: "#425733" }}>{p.price}</span>
                              {p.originalPrice && (
                                <span className="text-[10px] line-through" style={{ color: "#ef4444" }}>{p.originalPrice}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#425733" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Legacy product cards from AI streaming */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && !msg.products && (
                    <div className="mt-3 flex flex-col gap-2">
                      {msg.suggestedProducts.map((p) => (
                        <a
                          key={p.slug}
                          href={p.slug}
                          className="cw-product-card flex items-center gap-3 no-underline"
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e3ebdd",
                            borderRadius: 14,
                            padding: "10px 12px",
                          }}
                        >
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#f2f8f2" }}>
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-lg">🌿</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[12px] font-semibold truncate" style={{ color: "#2c3e24" }}>{p.name}</span>
                            {p.price && <span className="text-[12px] font-bold" style={{ color: "#425733" }}>{p.price}</span>}
                          </div>
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#425733" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Quick chips — 2-column grid */}
                  {i === 0 && msg.role === "assistant" && !isSending && messages.length === 1 && (
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {quickQs.map((q, qi) => (
                        <motion.button
                          key={q.text}
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.08 + qi * 0.055, type: "spring", stiffness: 420, damping: 28 }}
                          onClick={() => sendMessage(q.text)}
                          className="cw-chip text-left text-[11.5px] font-medium cursor-pointer flex items-center gap-1.5"
                          style={{
                            padding: "8px 11px",
                            background: "#ffffff",
                            border: "1px solid #dde8d7",
                            borderRadius: 12,
                            color: "#2d4a22",
                            lineHeight: 1.35,
                          }}
                        >
                          <span className="text-base leading-none flex-shrink-0" style={{ fontSize: 13 }}>{q.icon}</span>
                          <span className="flex-1 min-w-0 truncate">{q.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT ────────────────────────────── */}
            <div className="flex-shrink-0 px-3 py-2.5" style={{ borderTop: "1px solid #e3ebdd", background: "#ffffff" }}>
              <div className="flex items-end gap-2 rounded-2xl px-3.5 py-2" style={{ background: "#f5f8f3", border: "1px solid #e3ebdd" }}>
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.length <= MAX_INPUT) setMessage(v);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
                    }}
                    onKeyDown={handleKey}
                    disabled={isSending || isCooldown || userMsgCount >= MAX_MESSAGES}
                    placeholder={isCooldown ? "Đợi chút..." : userMsgCount >= MAX_MESSAGES ? "Đã đạt giới hạn" : "Hỏi em về terrarium..."}
                    rows={1}
                    className="cw-input w-full resize-none border-none outline-none bg-transparent text-[13px] leading-relaxed font-[inherit]"
                    style={{ minHeight: 32, maxHeight: 80, boxShadow: "none", color: "#2c3e24" }}
                  />
                  {message.length > 300 && (
                    <span className="absolute right-0 bottom-0 text-[10px] font-semibold" style={{ color: message.length >= MAX_INPUT ? "#dc2626" : "#9ca3af" }}>
                      {message.length}/{MAX_INPUT}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => sendMessage(message)}
                  disabled={isSending || isCooldown || !message.trim() || userMsgCount >= MAX_MESSAGES}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: message.trim() && !isSending && !isCooldown
                      ? "linear-gradient(135deg, #3a5229, #4a6a35)"
                      : "#c5d9c0",
                    border: "none",
                    cursor: message.trim() && !isSending && !isCooldown ? "pointer" : "default",
                  }}
                  aria-label="Gửi"
                >
                  <Send size={14} color="white" />
                </button>
              </div>
              <div className="text-center pt-1.5 pb-0.5">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-[11px] font-medium no-underline transition-colors"
                  style={{ color: "#8a9e84" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#2d4a22")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#8a9e84")}
                >
                  <ExternalLink size={10} /> Khám phá bộ sưu tập
                </Link>
              </div>
            </div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ═══ FLOATING BUBBLE (hidden when chat is open) ═══ */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="fixed z-[9999] select-none touch-none"
            style={{ right: bubblePos.right, bottom: bubblePos.bottom }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <div className="flex items-center gap-2">
              {/* Tooltip */}
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 28 }}
                className="text-[11.5px] font-medium px-3.5 py-1.5 rounded-full cursor-pointer whitespace-nowrap"
                style={{
                  background: "#ffffff",
                  color: "#2d4a22",
                  boxShadow: "0 2px 14px rgba(45,74,34,0.14), 0 0 0 1px rgba(220,235,215,0.8)",
                }}
              >
                Hỏi em nhé! 🌿
              </motion.div>

              {/* Bubble — forest gradient */}
              <div
                className="cw-bubble-idle relative w-14 h-14 flex items-center justify-center cursor-pointer rounded-full"
                style={{
                  background: "linear-gradient(135deg, #2d4a22 0%, #3d6b2e 60%, #4a7a38 100%)",
                  transition: "transform 0.2s ease",
                }}
              >
                {/* Leaf icon */}
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.5 2 4 6 4 10C4 14.5 7.5 18 12 20C16.5 18 20 14.5 20 10C20 6 17.5 2 12 2Z" fill="rgba(255,255,255,0.9)" />
                  <path d="M12 20V22" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 10C10 12 9 14 9 16" stroke="rgba(45,74,34,0.5)" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {/* Status dot */}
                <span
                  className="cw-status-dot absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                  style={{ background: "#7dba5f", border: "2.5px solid white", zIndex: 10 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
