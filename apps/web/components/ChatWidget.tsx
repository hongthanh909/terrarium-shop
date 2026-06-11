"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Head from "next/head";
import { usePathname } from "next/navigation";
import {
  MessageCircle, Send, Bot, Sparkles, X,
  ShoppingBag, ExternalLink, RefreshCw
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "db" | "fallback";
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
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : <span key={j}>{part}</span>
      )}
    </span>
  ));
}

function getPageContext(pathname: string): PageContext {
  if (pathname.match(/^\/products\/[\w-]+$/)) {
    return { type: "product", slug: pathname.replace("/products/", "") };
  }
  if (pathname.startsWith("/blog")) {
    return { type: "blog" };
  }
  if (pathname === "/explore") {
    return { type: "explore" };
  }
  if (pathname.startsWith("/checkout")) {
    return { type: "checkout" };
  }
  if (pathname.startsWith("/orders")) {
    return { type: "orders" };
  }
  if (pathname === "/consult") {
    return { type: "consult" };
  }
  if (pathname === "/") {
    return { type: "home" };
  }
  return { type: "general" };
}

function getWelcomeMessage(ctx: PageContext): string {
  switch (ctx.type) {
    case "product":
      if (ctx.productName) {
        return `Xin chào! 👋 Bạn đang xem **${ctx.productName}**${ctx.productPrice ? ` (${ctx.productPrice})` : ""}.\nHỏi tôi bất cứ điều gì về sản phẩm này nhé:\n• Chăm sóc & bảo hành\n• Sản phẩm tương tự\n• Gợi ý mua kèm phụ kiện`;
      }
      return "Xin chào! 👋 Tôi là trợ lý AI của **Tiệm Rêu**.\nBạn đang xem chi tiết sản phẩm — hỏi tôi về sản phẩm này nhé!";
    case "blog":
      return "Xin chào! 👋 Tôi là trợ lý AI của **Tiệm Rêu**.\nBạn đang đọc blog — tôi có thể giúp bạn:\n• Tìm kiếm sản phẩm liên quan\n• Tư vấn chăm sóc terrarium\n• Giải đáp thắc mắc";
    case "explore":
      return "Xin chào! 👋 Tôi là trợ lý AI của **Tiệm Rêu**.\nBạn đang khám phá bộ sưu tập — tôi có thể giúp:\n• Gợi ý sản phẩm phù hợp với bạn\n• So sánh các sản phẩm\n• Tư vấn quà tặng";
    case "checkout":
      return "Xin chào! 👋 Bạn đang thanh toán.\nTôi có thể giúp bạn:\n• Thông tin vận chuyển & giao hàng\n• Hỗ trợ mã giảm giá\n• Chính sách đổi trả";
    case "orders":
      return "Xin chào! 👋 Bạn đang xem đơn hàng.\nTôi có thể giúp bạn:\n• Kiểm tra tình trạng đơn hàng\n• Chính sách đổi trả & bảo hành\n• Hỗ trợ liên hệ shop";
    case "home":
      return "Xin chào! 👋 Tôi là trợ lý AI của **Tiệm Rêu**.\nTôi có thể giúp bạn:\n• Tư vấn chọn terrarium phù hợp\n• Hướng dẫn chăm sóc cây\n• Gợi ý sản phẩm và giá cả";
    default:
      return "Xin chào! 👋 Tôi là trợ lý AI của **Tiệm Rêu**.\nTôi có thể giúp bạn:\n• Tư vấn chọn terrarium phù hợp\n• Hướng dẫn chăm sóc cây\n• Gợi ý sản phẩm và giá cả";
  }
}

const MAX_MESSAGES_PER_SESSION = 30;
const SEND_COOLDOWN_MS = 3000;
const MAX_INPUT_LENGTH = 400;

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

  // Detect page changes → update context & reset chat
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      const ctx = getPageContext(pathname);
      setPageCtx(ctx);
      setProductData(null);

      // Fetch product info if on a product detail page
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

  // Build enriched page context for API
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

  // Initial message depends on context
  const initialMessage = useMemo<ChatMessage>(() => ({
    role: "assistant",
    content: getWelcomeMessage(enrichedCtx),
  }), [enrichedCtx]);

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);

  // Reset messages when initial message changes (page navigation)
  const prevWelcomeRef = useRef(initialMessage.content);
  useEffect(() => {
    if (initialMessage.content !== prevWelcomeRef.current) {
      prevWelcomeRef.current = initialMessage.content;
      setMessages([initialMessage]);
      setIsAIAvailable(null);
    }
  }, [initialMessage]);

  const messageCount = messages.filter(m => m.role === "user").length;

  // Quick questions for current page type
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

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending || isCooldown) return;
    
    if (messageCount >= MAX_MESSAGES_PER_SESSION) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Dạ cuộc trò chuyện đã khá dài rồi 🌿 Để được tư vấn chi tiết hơn, anh/chị liên hệ trực tiếp qua Zalo hoặc Facebook của Tiệm Rêu nhé!\n\nHoặc bấm nút 🔄 để bắt đầu cuộc trò chuyện mới.",
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
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), SEND_COOLDOWN_MS);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(message); }
  };

  const Cursor = () => (
    <span className="inline-block w-[2px] h-3.5 bg-[#4a7c3f] ml-0.5 align-middle rounded-full animate-pulse" />
  );

  // ── Page-aware label for tooltip ──
  const tooltipLabel = enrichedCtx.type === "product" && enrichedCtx.productName
    ? `Hỏi AI về ${enrichedCtx.productName.length > 15 ? enrichedCtx.productName.slice(0, 15) + "…" : enrichedCtx.productName}`
    : "Tư vấn AI 24/7 🌿";

  return (
    <>
      {/* ═══════════════════════════════════════
          CHAT PANEL — fixed, bottom-right, above button
      ═══════════════════════════════════════ */}
      <div
        className={`fixed z-[9998] transition-all duration-300 ease-out`}
        style={{
          bottom: "90px",
          right: "24px",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          boxShadow: "0 8px 40px rgba(66,87,51,0.08)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Responsive styles */}
        <style>{`
          .suggestion-card {
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .suggestion-card:hover {
            transform: translateY(-4px) scale(1.03);
            box-shadow: 0 4px 12px rgba(66,87,51,0.12);
          }
        `}</style>
        <style>{`
          .chat-panel-responsive {
            width: calc(100vw - 48px);
            height: calc(100vh - 160px);
            max-height: 600px;
          }
          @media (min-width: 640px) {
            .chat-panel-responsive {
              width: 380px;
              height: 520px;
              max-height: 520px;
            }
          }
        `}</style>
        <div className="chat-panel-responsive flex flex-col" style={{ borderRadius: "inherit", overflow: "hidden" }}>
        {/* ── HEADER ─────────────────────────────── */}
        <div
          style={{
            background: "#425733",
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
            background: "rgba(255,255,255,0.1)",
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
              {isAIAvailable === false && (
                <span style={{
                  background: "rgba(251,191,36,0.25)",
                  borderRadius: 99, padding: "2px 8px",
                  fontSize: 10, color: "#fde68a",
                }}>Cơ bản</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: isAIAvailable === true ? "#4ade80" : isAIAvailable === false ? "#fbbf24" : "#a3c49a",
                boxShadow: isAIAvailable === true ? "0 0 0 2px rgba(74,222,128,0.3)" : "none",
              }} />
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
                {isAIAvailable === true ? "AI đang hoạt động ✨" : isAIAvailable === false ? "Chế độ cơ bản" : "Đang hoạt động"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <a
              href="/products"
              title="Xem sản phẩm"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", textDecoration: "none",
              }}
            >
              <ShoppingBag size={14} />
            </a>
            <button
              onClick={resetChat}
              title="Làm mới cuộc trò chuyện"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.1)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white",
              }}
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setOpen(false)}
              title="Thu nhỏ"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.1)",
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
          background: "transparent",
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
                    background: "#425733",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Bot size={14} color="white" />
                  </div>
                )}

                {/* Bubble */}
                <div style={{
                  maxWidth: "78%",
                  background: msg.role === "user" ? "#425733" : "white",
                  color: msg.role === "user" ? "white" : "#1f2d1c",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "9px 13px",
                  fontSize: 13,
                  lineHeight: 1.55,
                  boxShadow: "0 2px 4px rgba(66,87,51,0.06)",
                  whiteSpace: "pre-line",
                }}>
                  {msg.isStreaming && msg.content === "" ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
                      {[0, 150, 300].map((d) => (
                        <span key={d} style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#425733",
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
                      className="suggestion-card"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "white", border: "1px solid #dbe2d8",
                        borderRadius: 12, padding: "8px 12px",
                        textDecoration: "none", gap: 8,
                        boxShadow: "0 1px 3px rgba(66,87,51,0.06)",
                        transition: "box-shadow 0.2s",
                      }}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={p.image || "/placeholder.png"} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <span style={{ fontSize: 12, color: "#1f2d1c", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {p.price && <span style={{ fontSize: 11, color: "#425733", fontWeight: 600 }}>{p.price}</span>}
                        <span style={{
                          background: "#425733", color: "white",
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

              {/* Quick reply chips — only after first bot message when no user messages yet */}
              {i === 0 && msg.role === "assistant" && !isSending && messages.length === 1 && (
                <div style={{ marginTop: 10, marginLeft: 33 }}>
                  <p style={{ fontSize: 11, color: "#7a9272", marginBottom: 6 }}>Câu hỏi gợi ý:</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {quickQs.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        style={{
                          fontSize: 11, padding: "5px 11px",
                          background: "white", border: "1px solid #dbe2d8",
                          borderRadius: 99, cursor: "pointer",
                          color: "#425733", fontWeight: 500,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "#f2f5f0"; }}
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
          borderTop: "1px solid #e2eadf",
          padding: "10px 12px",
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, position: "relative" }}>
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
              placeholder={isCooldown ? "Đợi chút..." : messageCount >= MAX_MESSAGES_PER_SESSION ? "Đã đạt giới hạn tin nhắn" : "Nhập câu hỏi của bạn..."}
              rows={1}
              style={{
                width: "100%", resize: "none", border: "none", outline: "none",
                background: "transparent", fontSize: 13, lineHeight: 1.5,
                color: "#1f2d1c", minHeight: 36, maxHeight: 80,
                fontFamily: "inherit",
                boxShadow: "none",
              }}
            />
            {message.length > 300 && (
              <span style={{
                position: "absolute", right: 4, bottom: 2,
                fontSize: 10, fontWeight: 600,
                color: message.length >= MAX_INPUT_LENGTH ? "#dc2626" : "#9ca3af",
              }}>
                {message.length}/{MAX_INPUT_LENGTH}
              </span>
            )}
          </div>
          <button
            onClick={() => sendMessage(message)}
            disabled={isSending || isCooldown || !message.trim() || messageCount >= MAX_MESSAGES_PER_SESSION}
            style={{
              width: 36, height: 36, borderRadius: 9999,
              background: message.trim() && !isSending && !isCooldown ? "#425733" : "#c5d9c0",
              border: "none", cursor: message.trim() && !isSending && !isCooldown ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.2s",
            }}
            aria-label="Gửi"
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#425733"; }}
            onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = message.trim() && !isSending && !isCooldown ? "#425733" : "#c5d9c0"; }}
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
            href="/products"
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
              background: "#425733", color: "white",
              fontSize: 11, fontWeight: 500,
              padding: "6px 12px", borderRadius: 99,
              cursor: "pointer", userSelect: "none",
              boxShadow: "0 2px 10px rgba(74,124,63,0.4)",
              animation: "chatPulse 2.5s ease-in-out infinite",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tooltipLabel}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Mở hỗ trợ AI"
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #425733 0%, #2d3d23 100%)",
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
