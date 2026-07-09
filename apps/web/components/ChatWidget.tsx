"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Maximize2, Minimize2, ExternalLink, Package, Truck, ShieldCheck, Sparkles, RotateCcw } from "lucide-react";

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
  source?: "ai" | "db" | "fallback" | "knowledge" | "guardrail" | "rag" | "disabled";
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

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

// ── Category menu items (Shopee-style 2×2 grid) ─────
const CATEGORY_ITEMS = [
  { icon: Package, label: "Tất cả sản phẩm", action: "products" as const, color: "#3d5a2a" },
  { icon: Truck, label: "Vận chuyển", action: "shipping" as const, color: "#4a7a38" },
  { icon: ShieldCheck, label: "Bảo hành", action: "warranty" as const, color: "#2d6b4f" },
  { icon: Sparkles, label: "Custom theo yêu cầu", action: "custom" as const, color: "#7a6830" },
];

// ── Quick suggestion pills ──────────────────────────
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

// ── Constants ────────────────────────────────────────
const MAX_MESSAGES = 30;
const COOLDOWN_MS = 3000;
const MAX_INPUT = 400;
const DEFAULT_PANEL_SIZE = { width: 380, height: 520 };
const EXPANDED_PANEL_SIZE = { width: 520, height: 700 };
const MIN_PANEL_SIZE = { width: 320, height: 420 };

const WELCOME_MESSAGE = "Xin chào, Rêu có thể giúp bạn điều gì?";

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
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const latestUserMessageRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Viewport dimensions ────────────────────────
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setViewport({
      w: document.documentElement.clientWidth,
      h: document.documentElement.clientHeight,
    });
    update();
    const viewportObserver = new ResizeObserver(update);
    viewportObserver.observe(document.documentElement);
    window.addEventListener("resize", update);
    return () => {
      viewportObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // ── Free drag (absolute position) ──────────────
  const [bubblePos, setBubblePos] = useState<{ right: number; bottom: number }>({ right: 16, bottom: 92 });
  const hasMovedRef = useRef(false);

  useEffect(() => {
    if (!hasMovedRef.current) {
      const isProduct = pathname.match(/^\/products\/[\w-]+$/);
      setBubblePos(prev => ({ ...prev, bottom: isProduct ? 172 : 92 }));
    }
  }, [pathname]);

  const dragState = useRef<{ dragging: boolean; moved: boolean; startX: number; startY: number; startRight: number; startBottom: number } | null>(null);
  // Panel anchored from bottom-right (same as bubble) — avoids scroll-jump on open
  const [panelRect, setPanelRect] = useState({ right: 16, bottom: 160, ...DEFAULT_PANEL_SIZE });
  const panelDragState = useRef<{ dragging: boolean; startX: number; startY: number; startRight: number; startBottom: number } | null>(null);
  const panelResizeState = useRef<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startRight: number;
    startBottom: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const clampPanelRect = useCallback((rect: typeof panelRect) => {
    const vw = viewport.w || document.documentElement.clientWidth;
    const vh = viewport.h || document.documentElement.clientHeight;
    const width = Math.max(MIN_PANEL_SIZE.width, Math.min(rect.width, vw - 16));
    const height = Math.max(MIN_PANEL_SIZE.height, Math.min(rect.height, vh - 16));
    return {
      width,
      height,
      right: Math.max(8, Math.min(rect.right, vw - width - 8)),
      bottom: Math.max(8, Math.min(rect.bottom, vh - height - 8)),
    };
  }, [viewport.h, viewport.w]);

  const getPanelRectNearBubble = useCallback((size = DEFAULT_PANEL_SIZE) => {
    const vw = viewport.w || document.documentElement.clientWidth;
    const vh = viewport.h || document.documentElement.clientHeight;
    const width = Math.min(size.width, vw - 16);
    const height = Math.min(size.height, vh - 16);
    // Anchor panel above the bubble using the same right/bottom coordinate system
    const right = bubblePos.right;
    const bottom = bubblePos.bottom + 56 + 12; // bubble height (56) + gap (12)
    return clampPanelRect({ right, bottom, width, height });
  }, [bubblePos.bottom, bubblePos.right, clampPanelRect, viewport.h, viewport.w]);

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
    const dx = ds.startX - e.clientX;
    const dy = ds.startY - e.clientY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      ds.moved = true;
      hasMovedRef.current = true;
    }
    if (!ds.moved) return;

    const newRight = Math.max(0, Math.min(window.innerWidth - 60, ds.startRight + dx));
    const minBottom = window.innerWidth < 640 ? 92 : 20;
    const newBottom = Math.max(minBottom, Math.min(window.innerHeight - 60, ds.startBottom + dy));
    setBubblePos({ right: newRight, bottom: newBottom });
  }, []);

  const onPointerUp = useCallback(() => {
    const ds = dragState.current;
    if (ds && !ds.moved) {
      if (!open) {
        setPanelRect(getPanelRectNearBubble(expanded ? EXPANDED_PANEL_SIZE : DEFAULT_PANEL_SIZE));
      }
      setOpen(prev => !prev);
    }
    dragState.current = null;
  }, [expanded, getPanelRectNearBubble, open]);

  const onPanelDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panelDragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startRight: panelRect.right,
      startBottom: panelRect.bottom,
    };
  }, [panelRect.right, panelRect.bottom]);

  const onPanelDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const ds = panelDragState.current;
    if (!ds || !ds.dragging) return;
    // Moving right → right decreases; moving down → bottom decreases
    setPanelRect(prev => clampPanelRect({
      ...prev,
      right: ds.startRight - (e.clientX - ds.startX),
      bottom: ds.startBottom - (e.clientY - ds.startY),
    }));
  }, [clampPanelRect]);

  const onPanelDragEnd = useCallback(() => {
    panelDragState.current = null;
  }, []);

  const onPanelResizeStart = useCallback((handle: ResizeHandle) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panelResizeState.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startRight: panelRect.right,
      startBottom: panelRect.bottom,
      startWidth: panelRect.width,
      startHeight: panelRect.height,
    };
  }, [panelRect.bottom, panelRect.right, panelRect.width, panelRect.height]);

  const onPanelResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rs = panelResizeState.current;
    if (!rs) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - rs.startX;
    const dy = e.clientY - rs.startY;
    const next = {
      right: rs.startRight,
      bottom: rs.startBottom,
      width: rs.startWidth,
      height: rs.startHeight,
    };

    // In right/bottom coordinate system:
    // 'e' handle: expand right edge → width grows, right stays same
    if (rs.handle.includes("e")) next.width = rs.startWidth + dx;
    // 's' handle: expand bottom edge → height grows, bottom stays same  
    if (rs.handle.includes("s")) next.height = rs.startHeight + dy;
    // 'w' handle: expand left edge → width grows, right increases
    if (rs.handle.includes("w")) {
      next.width = rs.startWidth - dx;
      next.right = rs.startRight + dx;
    }
    // 'n' handle: expand top edge → height grows, bottom increases
    if (rs.handle.includes("n")) {
      next.height = rs.startHeight - dy;
      next.bottom = rs.startBottom + dy;
    }

    setPanelRect(clampPanelRect(next));
  }, [clampPanelRect]);

  const onPanelResizeEnd = useCallback(() => {
    panelResizeState.current = null;
  }, []);

  useLayoutEffect(() => {
    if (open) setPanelRect(getPanelRectNearBubble(expanded ? EXPANDED_PANEL_SIZE : DEFAULT_PANEL_SIZE));
  }, [expanded, getPanelRectNearBubble, open]);

  useEffect(() => {
    if (!open) return;
    setPanelRect(prev => clampPanelRect(prev));
  }, [clampPanelRect, open, viewport.h, viewport.w]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setPanelRect(prev => clampPanelRect({ ...prev, width, height }));
    });
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [clampPanelRect, open]);

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
    content: WELCOME_MESSAGE,
  }), []);

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);

  const userMsgCount = messages.filter(m => m.role === "user").length;
  const showWelcomeScreen = messages.length === 1 && !isSending;
  const latestUserIndex = messages.map((m) => m.role).lastIndexOf("user");
  const conversationMessages = messages
    .map((msg, index) => ({ msg, index }))
    .filter(({ msg, index }) => !(index === 0 && msg.role === "assistant"));

  useEffect(() => {
    if (!open) return;
    if (showWelcomeScreen) {
      messagesScrollRef.current?.scrollTo({ top: 0 });
      return;
    }
    latestUserMessageRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [latestUserIndex, open, showWelcomeScreen]);
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

  // ── Handle category click ─────────────────────
  const handleCategoryClick = (action: string) => {
    switch (action) {
      case "products":
        sendMessage("Tất cả sản phẩm");
        break;
      case "shipping":
        sendMessage("Chính sách vận chuyển");
        break;
      case "warranty":
        sendMessage("Chính sách bảo hành");
        break;
      case "custom":
        // Placeholder — sẽ hiện Zalo/mail trong tương lai
        sendMessage("Tôi muốn đặt terrarium theo yêu cầu riêng");
        break;
    }
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

  const panelScale = Math.max(
    0.8,
    Math.min(
      1.2,
      Math.min(
        panelRect.width / DEFAULT_PANEL_SIZE.width,
        panelRect.height / DEFAULT_PANEL_SIZE.height,
      ),
    ),
  );
  const compactPanel = panelRect.width < 370 || panelRect.height < 500;
  const textareaMaxHeight = Math.max(72, Math.min(120, panelRect.height * 0.22));

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return (
    <>
      <style>{`
        .cw-panel {
          position: fixed;
          min-width: 320px;
          min-height: 420px;
          max-width: calc(100% - 16px);
          max-height: calc(100dvh - 16px);
        }
        @media (max-width: 639px) {
          .cw-panel {
            border-radius: 18px !important;
            min-width: min(320px, calc(100% - 16px));
            max-width: calc(100% - 16px);
            max-height: calc(100dvh - 16px);
          }
        }
        .cw-panel-header { cursor: move; touch-action: none; user-select: none; }
        .cw-panel-header > * { position: relative; z-index: 5; }
        .cw-resize-handle {
          position: absolute;
          z-index: 4;
          touch-action: none;
          user-select: none;
        }
        .cw-resize-handle::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          background: rgba(66,87,51,0);
          transition: background-color 0.16s ease;
        }
        .cw-resize-handle:hover::after { background: rgba(66,87,51,0.18); }
        .cw-resize-n, .cw-resize-s { left: 16px; right: 16px; height: 10px; cursor: ns-resize; }
        .cw-resize-n { top: 0; }
        .cw-resize-s { bottom: 0; }
        .cw-resize-n::after, .cw-resize-s::after { left: 22%; right: 22%; height: 3px; top: 50%; transform: translateY(-50%); }
        .cw-resize-e, .cw-resize-w { top: 16px; bottom: 16px; width: 10px; cursor: ew-resize; }
        .cw-resize-e { right: 0; }
        .cw-resize-w { left: 0; }
        .cw-resize-e::after, .cw-resize-w::after { top: 22%; bottom: 22%; width: 3px; left: 50%; transform: translateX(-50%); }
        .cw-resize-ne, .cw-resize-nw, .cw-resize-se, .cw-resize-sw { width: 18px; height: 18px; }
        .cw-resize-ne { top: 0; right: 0; cursor: nesw-resize; }
        .cw-resize-sw { bottom: 0; left: 0; cursor: nesw-resize; }
        .cw-resize-nw { top: 0; left: 0; cursor: nwse-resize; }
        .cw-resize-se { bottom: 0; right: 0; cursor: nwse-resize; }
        .cw-resize-ne::after, .cw-resize-nw::after, .cw-resize-se::after, .cw-resize-sw::after {
          inset: 5px;
          border: 1px solid rgba(66,87,51,0.18);
        }
        .cw-fluid-text { font-size: calc(13px * var(--cw-scale)); }
        .cw-fluid-small { font-size: calc(12px * var(--cw-scale)); }
        .cw-fluid-gap { gap: calc(12px * var(--cw-scale)); }
        .cw-fluid-header { gap: calc(12px * var(--cw-scale)); padding: calc(12px * var(--cw-scale)) calc(16px * var(--cw-scale)); }
        .cw-fluid-avatar { width: calc(36px * var(--cw-scale)); height: calc(36px * var(--cw-scale)); }
        .cw-fluid-action { width: calc(32px * var(--cw-scale)); height: calc(32px * var(--cw-scale)); }
        .cw-fluid-action svg { width: calc(14px * var(--cw-scale)); height: calc(14px * var(--cw-scale)); }
        .cw-fluid-body { padding: calc(16px * var(--cw-scale)); }
        .cw-fluid-welcome { gap: calc(20px * var(--cw-scale)); }
        .cw-fluid-welcome-card { padding: calc(16px * var(--cw-scale)) calc(20px * var(--cw-scale)); }
        .cw-fluid-category-grid { gap: calc(10px * var(--cw-scale)); }
        .cw-fluid-category-card { gap: calc(8px * var(--cw-scale)); padding: calc(16px * var(--cw-scale)) calc(12px * var(--cw-scale)); }
        .cw-fluid-category-icon { width: calc(40px * var(--cw-scale)); height: calc(40px * var(--cw-scale)); }
        .cw-fluid-category-icon svg { width: calc(20px * var(--cw-scale)); height: calc(20px * var(--cw-scale)); }
        .cw-fluid-category-label { font-size: calc(12px * var(--cw-scale)); }
        .cw-fluid-input-wrap { gap: calc(8px * var(--cw-scale)); padding: calc(8px * var(--cw-scale)) calc(14px * var(--cw-scale)); }
        .cw-fluid-send { width: calc(44px * var(--cw-scale)); height: calc(44px * var(--cw-scale)); }
        .cw-fluid-send svg { width: calc(14px * var(--cw-scale)); height: calc(14px * var(--cw-scale)); }
        .cw-scroll::-webkit-scrollbar { width: 3px; }
        .cw-scroll::-webkit-scrollbar-track { background: transparent; }
        .cw-scroll::-webkit-scrollbar-thumb { background: rgba(66,87,51,0.15); border-radius: 99px; }
        .cw-input::placeholder { color: #8a9e84; }
        .cw-category-card {
          transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s cubic-bezier(0.4,0,0.2,1), border-color 0.2s cubic-bezier(0.4,0,0.2,1), background-color 0.2s cubic-bezier(0.4,0,0.2,1), color 0.2s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer;
        }
        .cw-category-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(45,74,34,0.12);
          border-color: #9ab88a;
        }
        .cw-category-card:active {
          transform: translateY(0) scale(0.97);
        }
        .cw-product-card {
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .cw-product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(66,87,51,0.1);
          border-color: #b8d8b8;
        }
        .cw-reset-btn {
          transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
          cursor: pointer;
        }
        .cw-reset-btn:hover {
          background: #f0f5ee !important;
          color: #2d4a22 !important;
          border-color: #9ab88a !important;
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
          return (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={`fixed z-[9999] cw-panel flex min-h-0 flex-col ${expanded ? "cw-expanded" : ""}`}
            style={{
              right: panelRect.right,
              bottom: panelRect.bottom,
              width: panelRect.width,
              height: panelRect.height,
              "--cw-scale": panelScale,
              borderRadius: 16,
              overflow: "hidden",
              background: "#ffffff",
              boxShadow: "0 12px 48px rgba(26,46,18,0.12), 0 0 0 1px rgba(227,235,221,0.6)",
            } as React.CSSProperties}
          >
            {(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as ResizeHandle[]).map((handle) => (
              <div
                key={handle}
                className={`cw-resize-handle cw-resize-${handle}`}
                onPointerDown={onPanelResizeStart(handle)}
                onPointerMove={onPanelResizeMove}
                onPointerUp={onPanelResizeEnd}
                onPointerCancel={onPanelResizeEnd}
                aria-hidden="true"
              />
            ))}

            {/* ── HEADER — "Chat với Rêu" ────────── */}
            <div
              className="cw-panel-header cw-fluid-header flex-shrink-0 flex items-center"
              onPointerDown={onPanelDragStart}
              onPointerMove={onPanelDragMove}
              onPointerUp={onPanelDragEnd}
              onPointerCancel={onPanelDragEnd}
              style={{
                background: "linear-gradient(135deg, #1a2f18 0%, #243d20 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Avatar */}
              <div
                className="cw-fluid-avatar rounded-full overflow-hidden flex-shrink-0"
                style={{ border: "1.5px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)" }}
              >
                <img
                  src="/logo.png"
                  alt="Rêu"
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </div>

              {/* "Chat với Rêu" */}
              <div className="flex-1 min-w-0">
                <span className="block font-bold cw-fluid-text" style={{ color: "#f0f7ee" }}>
                  Chat với Rêu
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-0.5 flex-shrink-0">
                {messages.length > 1 && (
                  <button
                    onClick={resetChat}
                    title="TrĂ² chuyá»‡n láº¡i"
                    className="cw-fluid-action rounded-lg flex items-center justify-center transition-colors"
                    style={{ border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                <button
                  onClick={() => {
                    const nextExpanded = !expanded;
                    setExpanded(nextExpanded);
                    setPanelRect(prev => clampPanelRect({
                      ...prev,
                      width: nextExpanded ? EXPANDED_PANEL_SIZE.width : DEFAULT_PANEL_SIZE.width,
                      height: nextExpanded ? EXPANDED_PANEL_SIZE.height : DEFAULT_PANEL_SIZE.height,
                    }));
                  }}
                  title={expanded ? "Thu nhỏ" : "Mở rộng"}
                  className="cw-fluid-action rounded-lg flex items-center justify-center transition-colors"
                  style={{ border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Đóng"
                  className="cw-fluid-action rounded-lg flex items-center justify-center transition-colors"
                  style={{ border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── MESSAGES AREA ───────────────────── */}
            <div
              ref={messagesScrollRef}
              className="cw-fluid-body min-h-0 flex-1 overflow-y-auto cw-scroll flex flex-col"
              style={{ background: "#fafbf8" }}
            >
              {/* ─── WELCOME SCREEN (initial state) ─── */}
              {showWelcomeScreen ? (
                <div className="cw-fluid-welcome flex flex-col">
                  {/* Welcome card */}
                  <div
                    className="cw-fluid-welcome-card rounded-2xl"
                    style={{ background: "linear-gradient(135deg, #eef5ea 0%, #f4f9f1 100%)", border: "1px solid #dde8d7" }}
                  >
                    <p className="font-semibold leading-snug" style={{ color: "#1e3319", fontSize: "calc(15px * var(--cw-scale))" }}>
                      {WELCOME_MESSAGE}
                    </p>
                  </div>

                  {/* ── 4 Category Cards (2×2 grid) ─── */}
                  <div className="cw-fluid-category-grid grid grid-cols-2">
                    {CATEGORY_ITEMS.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.action}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.05 + idx * 0.06, type: "spring", stiffness: 420, damping: 28 }}
                          onClick={() => handleCategoryClick(item.action)}
                          className="cw-category-card cw-fluid-category-card flex flex-col items-center rounded-xl text-center"
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e3ebdd",
                          }}
                        >
                          <div
                            className="cw-fluid-category-icon rounded-xl flex items-center justify-center"
                            style={{ background: `${item.color}12`, color: item.color }}
                          >
                            <Icon size={20} strokeWidth={1.8} />
                          </div>
                          <span className="cw-fluid-category-label font-semibold leading-tight" style={{ color: "#2d4a22" }}>
                            {item.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* ── "Bạn muốn hỏi về:" ─────────── */}
                  {/* ── "Trò chuyện lại với Rêu" ───── */}
                  <div style={{ borderTop: "1px solid #e8ede4", paddingTop: 16 }}>
                    <button
                      onClick={resetChat}
                      className="cw-reset-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #dde8d7",
                        color: "#5a6d52",
                      }}
                    >
                      <RotateCcw size={14} />
                      Trò chuyện lại với Rêu
                    </button>
                  </div>
                </div>
              ) : (
                /* ─── CONVERSATION MODE ─────────────── */
                <div className="flex min-h-full flex-col justify-start cw-fluid-gap pb-2">
                  {conversationMessages.map(({ msg, index }) => (
                    <motion.div
                      key={index}
                      ref={(node) => {
                        if (msg.role === "user" && index === latestUserIndex) {
                          latestUserMessageRef.current = node;
                        }
                      }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                      {msg.role === "user" ? (
                        <div className="flex justify-end">
                          <div
                            className="max-w-[78%] cw-fluid-text leading-relaxed"
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
                        <div className="flex items-start justify-start gap-2">
                          {/* Bot avatar mini */}
                          <div
                            className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5"
                            style={{ border: "1px solid rgba(66,87,51,0.15)", background: "#f0f5ee" }}
                          >
                            <img src="/logo.png" alt="" className="w-full h-full object-cover" />
                          </div>
                          <div
                            className="max-w-[88%] cw-fluid-text leading-[1.7] rounded-[4px_16px_16px_16px]"
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
                                  <span className="text-xs mt-0.5 block" style={{ color: "#526248" }}>{p.category}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[12px] font-bold" style={{ color: "#425733" }}>{p.price}</span>
                                  {p.originalPrice && (
                                    <span className="text-xs line-through" style={{ color: "#dc2626" }}>{p.originalPrice}</span>
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
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* ── INPUT ────────────────────────────── */}
              <div className="flex-shrink-0 px-[calc(12px*var(--cw-scale))] pt-[calc(10px*var(--cw-scale))] pb-[calc(env(safe-area-inset-bottom)+0.625rem)]" style={{ borderTop: "1px solid #e3ebdd", background: "#ffffff" }}>
              <div className="cw-fluid-input-wrap flex items-end rounded-2xl" style={{ background: "#f5f8f3", border: "1px solid #e3ebdd" }}>
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.length <= MAX_INPUT) setMessage(v);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, textareaMaxHeight) + "px";
                    }}
                    onKeyDown={handleKey}
                    disabled={isSending || isCooldown || userMsgCount >= MAX_MESSAGES}
                    placeholder={isCooldown ? "Đợi chút..." : userMsgCount >= MAX_MESSAGES ? "Đã đạt giới hạn" : "Hỏi em về terrarium..."}
                    rows={1}
                    className="cw-input w-full resize-none border-none outline-none bg-transparent cw-fluid-text leading-relaxed font-[inherit]"
                    style={{ minHeight: compactPanel ? 34 : 40, maxHeight: textareaMaxHeight, boxShadow: "none", color: "#2c3e24" }}
                  />
                  {message.length > 300 && (
                    <span className="absolute right-0 bottom-0 text-xs font-semibold" style={{ color: message.length >= MAX_INPUT ? "#dc2626" : "#526248" }}>
                      {message.length}/{MAX_INPUT}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => sendMessage(message)}
                  disabled={isSending || isCooldown || !message.trim() || userMsgCount >= MAX_MESSAGES}
                  className="cw-fluid-send rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
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
                  className="cw-fluid-small inline-flex items-center gap-1 font-medium no-underline transition-colors"
                  style={{ color: "#526248" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#2d4a22")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#526248")}
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
                Chat với Rêu
              </motion.div>

              {/* Bubble — forest gradient */}
              <div
                className="cw-bubble-idle relative w-14 h-14 flex items-center justify-center cursor-pointer rounded-full"
                style={{
                  background: "linear-gradient(135deg, #2d4a22 0%, #3d6b2e 60%, #4a7a38 100%)",
                  transition: "transform 0.2s ease",
                }}
              >
                <Bot size={27} strokeWidth={1.9} color="rgba(255,255,255,0.94)" aria-hidden="true" />
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
