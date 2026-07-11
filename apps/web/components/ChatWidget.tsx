"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Maximize2, Minimize2, ExternalLink, Package, Truck, ShieldCheck, Sparkles, RotateCcw, Loader2, ZoomIn, ZoomOut, Plus, AudioLines, Image as ImageIcon, Camera } from "lucide-react";
import { ImageWrapper } from "@/components/ui/ImageWrapper";

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
  source?: "ai" | "ai_vision" | "db" | "fallback" | "knowledge" | "guardrail" | "rag" | "disabled";
  isStreaming?: boolean;
  imageUrl?: string;
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
type ChatImageSource = "upload" | "camera" | "paste";

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

function getChatImageResizeConfig(source: ChatImageSource) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  if (source === "camera" || isMobile) {
    return { longEdge: CHAT_IMAGE_MOBILE_LONG_EDGE, quality: CHAT_IMAGE_MOBILE_QUALITY };
  }
  return { longEdge: CHAT_IMAGE_DESKTOP_LONG_EDGE, quality: CHAT_IMAGE_DESKTOP_QUALITY };
}

function resizeChatImage(file: File, source: ChatImageSource): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
      reject(new Error("UNSUPPORTED_IMAGE"));
      return;
    }
    if (file.size > MAX_CHAT_IMAGE_BYTES) {
      reject(new Error("IMAGE_TOO_LARGE"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("READ_IMAGE_FAILED"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("LOAD_IMAGE_FAILED"));
      img.onload = () => {
        const { longEdge, quality } = getChatImageResizeConfig(source);
        const scale = Math.min(1, longEdge / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("CANVAS_UNAVAILABLE"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

// ── Constants ────────────────────────────────────────
const MAX_MESSAGES = 30;
const COOLDOWN_MS = 3000;
const MAX_INPUT = 400;
const MAX_CHAT_IMAGE_BYTES = 10 * 1024 * 1024;
const CHAT_IMAGE_DESKTOP_LONG_EDGE = 1024;
const CHAT_IMAGE_DESKTOP_QUALITY = 0.82;
const CHAT_IMAGE_MOBILE_LONG_EDGE = 1280;
const CHAT_IMAGE_MOBILE_QUALITY = 0.84;
const DEFAULT_PANEL_SIZE = { width: 380, height: 520 };
const EXPANDED_PANEL_SIZE = { width: 520, height: 700 };
const MIN_PANEL_SIZE = { width: 320, height: 420 };
const MIN_UI_ZOOM = 0.8;
const MAX_UI_ZOOM = 1.25;
const UI_ZOOM_STEP = 0.05;

const WELCOME_MESSAGE = "Xin chào, Rêu có thể giúp bạn điều gì?";

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════
export default function ChatWidget() {
  const pathname = usePathname() ?? "";

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [uiZoom, setUiZoom] = useState(1);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const latestUserMessageRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
    const mobile = vw < 640;
    const minWidth = mobile ? Math.min(MIN_PANEL_SIZE.width, vw - 16) : MIN_PANEL_SIZE.width;
    const minHeight = mobile ? Math.min(360, vh - 16) : MIN_PANEL_SIZE.height;
    const targetWidth = mobile ? Math.min(Math.max(rect.width, minWidth), vw - 16) : rect.width;
    const targetHeight = mobile ? Math.min(Math.max(rect.height, minHeight), vh - 16) : rect.height;
    const width = Math.max(minWidth, Math.min(targetWidth, vw - 16));
    const height = Math.max(minHeight, Math.min(targetHeight, vh - 16));
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
    const mobile = vw < 640;
    const width = mobile ? vw - 16 : Math.min(size.width, vw - 16);
    const height = mobile ? Math.min(size.height, Math.max(360, Math.floor(vh * 0.72))) : Math.min(size.height, vh - 16);
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

  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;

    const handleZoomWheel = (event: WheelEvent) => {
      if (!event.ctrlKey || event.deltaY === 0) return;
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      setUiZoom((current) => {
        const next = current + direction * UI_ZOOM_STEP;
        return Math.min(MAX_UI_ZOOM, Math.max(MIN_UI_ZOOM, Number(next.toFixed(2))));
      });
    };

    panel.addEventListener("wheel", handleZoomWheel, { passive: false });
    return () => panel.removeEventListener("wheel", handleZoomWheel);
  }, [open]);

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

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const resetChat = () => {
    abortRef.current?.abort();
    setMessages([initialMessage]);
    setMessage("");
    setSelectedImage(null);
    setImageError(null);
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
  const handleImageFile = async (file: File, source: ChatImageSource) => {
    if (isSending || isCooldown || userMsgCount >= MAX_MESSAGES) return;
    try {
      setImageError(null);
      setAttachmentMenuOpen(false);
      const dataUrl = await resizeChatImage(file, source);
      setSelectedImage({ dataUrl, name: file.name });
      setOpen(true);
      setTimeout(() => textareaRef.current?.focus(), 80);
    } catch (err) {
      const errorMessage =
        err instanceof Error && err.message === "IMAGE_TOO_LARGE"
          ? "Anh toi da 5MB. Anh/chi chon anh nho hon hoac chup lai ro hon nhe."
          : "Anh chua dung dinh dang. Reu ho tro JPG, PNG hoac WebP.";
      setImageError(errorMessage);
    }
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await handleImageFile(file, "upload");
  };

  const handleCameraSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await handleImageFile(file, "camera");
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    const file = imageItem?.getAsFile();
    if (!file) return;

    event.preventDefault();
    await handleImageFile(file, "paste");
  };

  const sendMessage = async (text: string, image = selectedImage) => {
    if ((!text.trim() && !image) || isSending || isCooldown) return;
    setAttachmentMenuOpen(false);
    if (userMsgCount >= MAX_MESSAGES) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Cuộc trò chuyện đã khá dài rồi. Liên hệ Zalo hoặc Facebook Tiệm Rêu để được tư vấn chi tiết hơn nhé!\n\nBấm nút làm mới để bắt đầu lại.",
        isStreaming: false,
      }]);
      return;
    }

    const userMsg = text.trim() || "Anh/chi xem giup tinh trang be/cay/reu trong anh va tu van cach cham soc.";
    if (userMsg.length > MAX_INPUT) return;
    setMessage("");
    setSelectedImage(null);
    setImageError(null);

    const newMsgs: ChatMessage[] = [...messages, { role: "user", content: userMsg, imageUrl: image?.dataUrl }];
    setMessages(newMsgs);
    setIsSending(true);

    const history = newMsgs.slice(1).map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(image ? "/api/consult/image" : "/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: history.slice(0, -1),
          pageContext: enrichedCtx,
          ...(image ? { imageDataUrl: image.dataUrl } : {}),
        }),
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
        else if ((data.source === "knowledge" || data.source === "db" || data.source === "ai_vision") && isAIAvailable === null) setIsAIAvailable(true);
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

  const sizeScale = Math.max(
    0.8,
    Math.min(
      1.2,
      Math.min(
        panelRect.width / DEFAULT_PANEL_SIZE.width,
        panelRect.height / DEFAULT_PANEL_SIZE.height,
      ),
    ),
  );
  const panelScale = Math.max(0.7, Math.min(1.35, sizeScale * uiZoom));
  const isMobilePanel = viewport.w > 0 && viewport.w < 640;
  const compactPanel = panelRect.width < 370 || panelRect.height < 500;
  const textareaMaxHeight = Math.max(72, Math.min(120, panelRect.height * 0.22));
  const canZoomOut = uiZoom > MIN_UI_ZOOM;
  const canZoomIn = uiZoom < MAX_UI_ZOOM;
  const adjustUiZoom = useCallback((direction: -1 | 1) => {
    setUiZoom((current) => {
      const next = current + direction * UI_ZOOM_STEP;
      return Math.max(MIN_UI_ZOOM, Math.min(MAX_UI_ZOOM, Number(next.toFixed(2))));
    });
  }, []);

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
          --cw-primary: #425733;
          --cw-primary-strong: #2d4a22;
          --cw-primary-soft: #eef4ea;
          --cw-surface: #ffffff;
          --cw-surface-muted: #fafbf8;
          --cw-border: #e3ebdd;
          --cw-border-strong: #9ab88a;
          --cw-text: #1e3319;
          --cw-muted: #526248;
          --cw-danger: #dc2626;
          --cw-focus: rgba(66,87,51,0.38);
        }
        @media (max-width: 639px) {
          .cw-panel {
            border-radius: 18px !important;
            min-width: min(320px, calc(100% - 16px));
            min-height: min(360px, calc(100dvh - 16px));
            max-width: calc(100% - 16px);
            max-height: calc(100dvh - 16px);
          }
          .cw-resize-handle {
            display: none;
          }
          .cw-panel-header {
            cursor: default;
          }
          .cw-mobile-size-controls {
            display: flex;
          }
        }
        @media (min-width: 640px) {
          .cw-mobile-size-controls {
            display: none;
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
        .cw-fluid-text { font-size: clamp(13px, calc(13px * var(--cw-scale)), 18px); }
        .cw-fluid-small { font-size: clamp(12px, calc(12px * var(--cw-scale)), 16px); }
        .cw-fluid-gap { gap: calc(12px * var(--cw-scale)); }
        .cw-fluid-header { gap: calc(10px * var(--cw-scale)); padding: calc(12px * var(--cw-scale)) calc(14px * var(--cw-scale)); }
        .cw-fluid-avatar { width: calc(36px * var(--cw-scale)); height: calc(36px * var(--cw-scale)); }
        .cw-fluid-action { width: max(44px, calc(32px * var(--cw-scale))); height: max(44px, calc(32px * var(--cw-scale))); }
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
        .cw-bot-avatar {
          width: max(28px, calc(24px * var(--cw-scale)));
          height: max(28px, calc(24px * var(--cw-scale)));
        }
        .cw-product-card {
          gap: calc(10px * var(--cw-scale));
          min-height: calc(76px * var(--cw-scale));
          padding: calc(10px * var(--cw-scale)) calc(12px * var(--cw-scale));
        }
        .cw-product-image {
          width: clamp(56px, calc(62px * var(--cw-scale)), 84px);
          aspect-ratio: 1 / 1;
        }
        .cw-product-title {
          font-size: clamp(13px, calc(13px * var(--cw-scale)), 17px);
        }
        .cw-product-meta,
        .cw-product-price {
          font-size: clamp(12px, calc(12px * var(--cw-scale)), 16px);
        }
        .cw-sale-badge {
          font-size: clamp(10px, calc(10px * var(--cw-scale)), 12px);
        }
        .cw-product-action {
          width: max(44px, calc(34px * var(--cw-scale)));
          height: max(44px, calc(34px * var(--cw-scale)));
        }
        .cw-scroll::-webkit-scrollbar { width: 3px; }
        .cw-scroll::-webkit-scrollbar-track { background: transparent; }
        .cw-scroll::-webkit-scrollbar-thumb { background: rgba(66,87,51,0.15); border-radius: 99px; }
        .cw-input::placeholder { color: #8a9e84; }
        .cw-gpt-composer {
          min-height: calc(60px * var(--cw-scale));
          gap: calc(10px * var(--cw-scale));
          padding: calc(8px * var(--cw-scale)) calc(10px * var(--cw-scale));
          border: 1px solid rgba(26,46,18,0.1);
          background: rgba(255,255,255,0.94);
          border-radius: 999px;
          box-shadow: 0 10px 34px rgba(26,46,18,0.08), 0 1px 0 rgba(255,255,255,0.7) inset;
        }
        .cw-gpt-composer:focus-within {
          border-color: rgba(66,87,51,0.24);
          box-shadow: 0 12px 38px rgba(26,46,18,0.11), 0 0 0 3px rgba(143,186,111,0.13);
        }
        .cw-gpt-icon-btn {
          width: calc(40px * var(--cw-scale));
          height: calc(40px * var(--cw-scale));
          min-width: 40px;
          min-height: 40px;
        }
        .cw-gpt-send {
          width: calc(42px * var(--cw-scale));
          height: calc(42px * var(--cw-scale));
          min-width: 42px;
          min-height: 42px;
        }
        .cw-gpt-icon-btn svg,
        .cw-gpt-send svg {
          width: calc(18px * var(--cw-scale));
          height: calc(18px * var(--cw-scale));
        }
        .cw-gpt-input {
          padding: calc(8px * var(--cw-scale)) 0;
          min-height: calc(38px * var(--cw-scale));
        }
        .cw-attach-menu {
          left: 0;
          bottom: calc(48px * var(--cw-scale));
          min-width: calc(240px * var(--cw-scale));
          padding: calc(6px * var(--cw-scale));
          border-radius: calc(18px * var(--cw-scale));
          border: 1px solid rgba(26,46,18,0.1);
          background: rgba(255,255,255,0.98);
          box-shadow: 0 18px 44px rgba(26,46,18,0.16);
        }
        .cw-attach-title {
          padding: calc(6px * var(--cw-scale)) calc(10px * var(--cw-scale)) calc(4px * var(--cw-scale));
          color: #6b7664;
          font-size: clamp(11px, calc(11px * var(--cw-scale)), 14px);
          font-weight: 700;
        }
        .cw-attach-item {
          min-height: calc(44px * var(--cw-scale));
          gap: calc(10px * var(--cw-scale));
          padding: calc(8px * var(--cw-scale)) calc(10px * var(--cw-scale));
          border-radius: calc(14px * var(--cw-scale));
          color: #1f2d1a;
        }
        .cw-attach-item:hover {
          background: #f2f6ef;
        }
        .cw-attach-icon {
          width: calc(28px * var(--cw-scale));
          height: calc(28px * var(--cw-scale));
          min-width: 28px;
          min-height: 28px;
          background: #eef5e8;
          color: var(--cw-primary);
        }
        .cw-focusable:focus-visible {
          outline: 2px solid var(--cw-focus);
          outline-offset: 2px;
        }
        .cw-message-bubble {
          padding: calc(10px * var(--cw-scale)) calc(14px * var(--cw-scale));
        }
        .cw-size-control {
          width: max(38px, calc(32px * var(--cw-scale)));
          height: max(38px, calc(32px * var(--cw-scale)));
          border: 1px solid var(--cw-border);
          background: var(--cw-surface);
          color: var(--cw-primary);
        }
        .cw-size-control:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
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
        @media (prefers-reduced-motion: reduce) {
          .cw-category-card,
          .cw-product-card,
          .cw-reset-btn,
          .cw-fluid-action,
          .cw-fluid-send {
            transition-duration: 0.01ms !important;
          }
          .cw-bubble-idle,
          .cw-status-dot,
          .cw-product-card:hover,
          .cw-category-card:hover {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* ═══ CHAT PANEL ═══════════════════════════ */}
      <AnimatePresence>
        {open && (() => {
          return (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label="Chat với Rêu"
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
              background: "var(--cw-surface)",
              boxShadow: "0 12px 48px rgba(26,46,18,0.12), 0 0 0 1px rgba(227,235,221,0.6)",
            } as React.CSSProperties}
          >
            {!isMobilePanel && (["n", "s", "e", "w", "ne", "nw", "se", "sw"] as ResizeHandle[]).map((handle) => (
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
                <ImageWrapper
                  src="/logo.png"
                  alt="Rêu"
                  fill
                  sizes="48px"
                  noRound
                  className="object-cover select-none pointer-events-none"
                />
              </div>

              {/* "Chat với Rêu" */}
              <div className="flex-1 min-w-0">
                <span className="block font-bold cw-fluid-text" style={{ color: "#f0f7ee" }}>
                  Chat với Rêu
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-0.5 flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                {messages.length > 1 && (
                  <button
                    onClick={resetChat}
                    title="TrĂ² chuyá»‡n láº¡i"
                    aria-label="Bắt đầu lại cuộc trò chuyện"
                    className="cw-fluid-action cw-focusable rounded-lg flex items-center justify-center transition-colors"
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
                  aria-label={expanded ? "Thu nhỏ khung chat" : "Mở rộng khung chat"}
                  className="cw-fluid-action cw-focusable rounded-lg flex items-center justify-center transition-colors"
                  style={{ border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Đóng"
                  aria-label="Đóng khung chat"
                  className="cw-fluid-action cw-focusable rounded-lg flex items-center justify-center transition-colors"
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
              className="cw-mobile-size-controls items-center justify-center gap-2 px-[calc(12px*var(--cw-scale))] py-[calc(8px*var(--cw-scale))]"
              style={{ background: "var(--cw-surface)", borderBottom: "1px solid var(--cw-border)" }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="cw-size-control cw-focusable rounded-full flex items-center justify-center transition-colors"
                onClick={() => adjustUiZoom(-1)}
                disabled={!canZoomOut}
                aria-label="Giảm cỡ chữ và UI chat"
              >
                <ZoomOut size={15} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="cw-size-control cw-focusable rounded-full flex items-center justify-center transition-colors"
                onClick={() => setUiZoom(1)}
                disabled={uiZoom === 1}
                aria-label="Đưa cỡ chữ và UI chat về mặc định"
              >
                <RotateCcw size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="cw-size-control cw-focusable rounded-full flex items-center justify-center transition-colors"
                onClick={() => adjustUiZoom(1)}
                disabled={!canZoomIn}
                aria-label="Tăng cỡ chữ và UI chat"
              >
                <ZoomIn size={15} strokeWidth={2} />
              </button>
            </div>

            <div
              ref={messagesScrollRef}
              className="cw-fluid-body min-h-0 flex-1 overflow-y-auto cw-scroll flex flex-col"
              style={{ background: "var(--cw-surface-muted)" }}
            >
              {/* ─── WELCOME SCREEN (initial state) ─── */}
              {showWelcomeScreen ? (
                <div className="cw-fluid-welcome flex flex-col">
                  {/* Welcome card */}
                  <div
                    className="cw-fluid-welcome-card rounded-2xl"
                    style={{ background: "linear-gradient(135deg, var(--cw-primary-soft) 0%, #f4f9f1 100%)", border: "1px solid var(--cw-border)" }}
                  >
                    <p className="font-semibold leading-snug" style={{ color: "var(--cw-text)", fontSize: "calc(15px * var(--cw-scale))" }}>
                      {WELCOME_MESSAGE}
                    </p>
                  </div>

                  {/* ── 4 Category Cards (2×2 grid) ─── */}
                  <div className="cw-fluid-category-grid grid grid-cols-2">
                    {CATEGORY_ITEMS.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          type="button"
                          key={item.action}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.05 + idx * 0.06, type: "spring", stiffness: 420, damping: 28 }}
                          onClick={() => handleCategoryClick(item.action)}
                          aria-label={item.label}
                          className="cw-category-card cw-fluid-category-card cw-focusable flex flex-col items-center rounded-xl text-center"
                          style={{
                            background: "var(--cw-surface)",
                            border: "1px solid var(--cw-border)",
                          }}
                        >
                          <div
                            className="cw-fluid-category-icon rounded-xl flex items-center justify-center"
                            style={{ background: `${item.color}12`, color: item.color }}
                          >
                            <Icon size={20} strokeWidth={1.8} />
                          </div>
                          <span className="cw-fluid-category-label font-semibold leading-tight" style={{ color: "var(--cw-primary-strong)" }}>
                            {item.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* ── "Bạn muốn hỏi về:" ─────────── */}
                  {/* ── "Trò chuyện lại với Rêu" ───── */}
                  <div style={{ borderTop: "1px solid var(--cw-border)", paddingTop: 16 }}>
                    <button
                      type="button"
                      onClick={resetChat}
                      className="cw-reset-btn cw-focusable w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold"
                      style={{
                        background: "var(--cw-surface)",
                        border: "1px solid var(--cw-border)",
                        color: "var(--cw-muted)",
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
                            className="max-w-[78%] cw-fluid-text cw-message-bubble leading-relaxed"
                            style={{
                              background: "linear-gradient(135deg, #2d4a22, #3a5e2c)",
                              color: "#f0f7ee",
                              borderRadius: "16px 16px 4px 16px",
                              boxShadow: "0 2px 8px rgba(45,74,34,0.2)",
                            }}
                          >
                            {msg.imageUrl && (
                              <img
                                src={msg.imageUrl}
                                alt="Anh khach gui cho Reu phan tich"
                                className="mb-2 max-h-44 w-full rounded-xl object-cover"
                                style={{ border: "1px solid rgba(240,247,238,0.24)" }}
                              />
                            )}
                            {renderContent(msg.content)}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-start gap-2">
                          {/* Bot avatar mini */}
                          <div
                            className="cw-bot-avatar rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ border: "1px solid rgba(66,87,51,0.15)", background: "var(--cw-primary-soft)", color: "var(--cw-primary)" }}
                            aria-hidden="true"
                          >
                            <Bot size={14} strokeWidth={1.9} />
                          </div>
                          <div
                            className="max-w-[88%] cw-fluid-text cw-message-bubble leading-[1.7] rounded-[4px_16px_16px_16px]"
                            style={{
                              color: "var(--cw-text)",
                              background: "var(--cw-primary-soft)",
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
                              aria-label={`Xem sản phẩm ${p.name}`}
                              className="cw-product-card flex items-center no-underline"
                              style={{
                                background: "var(--cw-surface)",
                                border: "1px solid var(--cw-border)",
                                borderRadius: 14,
                              }}
                            >
                              <div className="cw-product-image rounded-xl overflow-hidden flex-shrink-0 relative" style={{ background: "var(--cw-primary-soft)" }}>
                                {p.image ? (
                                  <ImageWrapper src={p.image} alt={p.name} fill sizes="84px" noRound className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5" aria-hidden="true" />
                                  </div>
                                )}
                                {p.originalPrice && (
                                  <span className="cw-sale-badge absolute top-1 left-1 font-bold text-white px-1.5 py-0.5 rounded" style={{ background: "#e74c3c" }}>SALE</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="cw-product-title block font-semibold truncate" style={{ color: "var(--cw-text)" }}>{p.name}</span>
                                  <span className="cw-product-meta mt-0.5 block" style={{ color: "var(--cw-muted)" }}>{p.category}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="cw-product-price font-bold tabular-nums whitespace-nowrap" style={{ color: "var(--cw-primary)" }}>{p.price}</span>
                                  {p.originalPrice && (
                                    <span className="cw-product-meta line-through tabular-nums whitespace-nowrap" style={{ color: "var(--cw-danger)" }}>{p.originalPrice}</span>
                                  )}
                                </div>
                              </div>
                              <div className="cw-product-action flex-shrink-0 rounded-full flex items-center justify-center" style={{ background: "var(--cw-primary)" }}>
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
                              aria-label={`Xem sản phẩm ${p.name}`}
                              className="cw-product-card flex items-center no-underline"
                              style={{
                                background: "var(--cw-surface)",
                                border: "1px solid var(--cw-border)",
                                borderRadius: 14,
                              }}
                            >
                              <div className="cw-product-image rounded-xl overflow-hidden flex-shrink-0 relative" style={{ background: "var(--cw-primary-soft)" }}>
                                {p.image ? (
                                  <ImageWrapper src={p.image} alt={p.name} fill sizes="84px" noRound className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5" aria-hidden="true" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="cw-product-title block font-semibold truncate" style={{ color: "var(--cw-text)" }}>{p.name}</span>
                                {p.price && <span className="cw-product-price font-bold tabular-nums whitespace-nowrap" style={{ color: "var(--cw-primary)" }}>{p.price}</span>}
                              </div>
                              <div className="cw-product-action flex-shrink-0 rounded-full flex items-center justify-center" style={{ background: "var(--cw-primary)" }}>
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
              <div className="flex-shrink-0 px-[calc(12px*var(--cw-scale))] pt-[calc(10px*var(--cw-scale))] pb-[calc(env(safe-area-inset-bottom)+0.625rem)]" style={{ borderTop: "1px solid var(--cw-border)", background: "var(--cw-surface)" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraSelect}
              />
              {selectedImage && (
                <div className="mb-2 flex items-center gap-2 rounded-xl p-2" style={{ background: "#f5f8f3", border: "1px solid var(--cw-border)" }}>
                  <img
                    src={selectedImage.dataUrl}
                    alt="Anh se gui cho Reu phan tich"
                    className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate cw-fluid-small font-semibold" style={{ color: "var(--cw-text)" }}>{selectedImage.name}</div>
                    <div className="cw-fluid-small" style={{ color: "var(--cw-muted)" }}>Reu se phan tich anh nay cung cau hoi cua anh/chi.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="cw-focusable flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ color: "var(--cw-muted)", background: "var(--cw-surface)" }}
                    aria-label="Bo anh da chon"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {imageError && (
                <div className="mb-2 cw-fluid-small font-medium" style={{ color: "var(--cw-danger)" }}>
                  {imageError}
                </div>
              )}
              <div className="cw-gpt-composer flex items-center">
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setAttachmentMenuOpen((open) => !open)}
                    disabled={isSending || isCooldown || userMsgCount >= MAX_MESSAGES}
                    className="cw-gpt-icon-btn cw-focusable rounded-full flex items-center justify-center transition-colors"
                    style={{
                      background: attachmentMenuOpen ? "#f2f6ef" : "transparent",
                      border: "none",
                      color: selectedImage ? "var(--cw-primary)" : "#121212",
                      cursor: !isSending && !isCooldown && userMsgCount < MAX_MESSAGES ? "pointer" : "default",
                    }}
                    aria-label="Mo tuy chon them anh"
                    aria-expanded={attachmentMenuOpen}
                  >
                    <Plus />
                  </button>
                  {attachmentMenuOpen && (
                    <div className="cw-attach-menu absolute z-20">
                      <div className="cw-attach-title">Chọn ảnh kiểm tra bể</div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="cw-attach-item cw-focusable flex w-full items-center text-left text-sm font-medium transition-colors"
                      >
                        <span className="cw-attach-icon flex items-center justify-center rounded-full">
                          <ImageIcon size={15} />
                        </span>
                        <span>Chọn ảnh từ thiết bị</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentMenuOpen(false);
                          cameraInputRef.current?.click();
                        }}
                        className="cw-attach-item cw-focusable flex w-full items-center text-left text-sm font-medium transition-colors"
                      >
                        <span className="cw-attach-icon flex items-center justify-center rounded-full">
                          <Camera size={15} />
                        </span>
                        <span>Chụp ảnh trực tiếp</span>
                      </button>
                    </div>
                  )}
                </div>
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
                    onPaste={handlePaste}
                    disabled={isSending || isCooldown || userMsgCount >= MAX_MESSAGES}
                    placeholder={isCooldown ? "Đợi chút..." : userMsgCount >= MAX_MESSAGES ? "Đã đạt giới hạn" : "Hỏi em về terrarium..."}
                    aria-label="Nhập tin nhắn cho Rêu"
                    aria-describedby={isCooldown ? "cw-input-status" : undefined}
                    rows={1}
                    className="cw-input cw-gpt-input w-full resize-none border-none outline-none bg-transparent cw-fluid-text leading-relaxed font-[inherit]"
                    style={{ maxHeight: textareaMaxHeight, boxShadow: "none", color: "var(--cw-text)" }}
                  />
                  {message.length > 300 && (
                    <span className="absolute right-0 bottom-0 text-xs font-semibold" style={{ color: message.length >= MAX_INPUT ? "var(--cw-danger)" : "var(--cw-muted)" }}>
                      {message.length}/{MAX_INPUT}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => sendMessage(message)}
                  disabled={isSending || isCooldown || (!message.trim() && !selectedImage) || userMsgCount >= MAX_MESSAGES}
                  className="cw-gpt-send cw-focusable rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    background: "#0f0f0f",
                    border: "none",
                    opacity: isSending || isCooldown || userMsgCount >= MAX_MESSAGES ? 0.5 : 1,
                    cursor: (message.trim() || selectedImage) && !isSending && !isCooldown ? "pointer" : "default",
                  }}
                  aria-label={isSending ? "Đang gửi tin nhắn" : "Gửi tin nhắn"}
                >
                  {isSending ? (
                    <Loader2 color="white" className="animate-spin" />
                  ) : message.trim() || selectedImage ? (
                    <Send color="white" />
                  ) : (
                    <AudioLines color="white" />
                  )}
                </button>
              </div>
              {(isCooldown || userMsgCount >= MAX_MESSAGES) && (
                <div id="cw-input-status" className="cw-fluid-small mt-1 text-center font-medium" style={{ color: "var(--cw-muted)" }}>
                  {userMsgCount >= MAX_MESSAGES ? "Đã đạt giới hạn trò chuyện" : "Rêu đang nghỉ vài giây trước tin nhắn tiếp theo"}
                </div>
              )}
              <div className="hidden">
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
            role="button"
            tabIndex={0}
            aria-label="Mở chat với Rêu"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="fixed z-[9999] select-none touch-none"
            style={{ right: bubblePos.right, bottom: bubblePos.bottom }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPanelRect(getPanelRectNearBubble(expanded ? EXPANDED_PANEL_SIZE : DEFAULT_PANEL_SIZE));
                setOpen(true);
              }
            }}
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
