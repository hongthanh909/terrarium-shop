"use client";

/* eslint-disable @next/next/no-img-element -- Chat images and storage URLs are user-generated at runtime. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Inbox,
  Loader2,
  MessageSquare,
  Search,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { useChatAutoScroll } from "@/components/chat/useChatAutoScroll";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  senderType: "CUSTOMER" | "ADMIN";
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
};

type Conversation = {
  id: string;
  status: "OPEN" | "CLOSED";
  adminUnreadCount: number;
  lastMessageAt: string;
  customer: { id: string; name: string | null; email: string; phone: string | null; image: string | null };
  product: { id: string; type: "CATALOG" | "MARKETPLACE"; name: string; image: string | null; href: string } | null;
  order: { id: string; orderNumber: string; shippingQuoteRequired: boolean } | null;
  messages: ChatMessage[];
};

function relativeTime(value: string) {
  const date = new Date(value);
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
}

function messageTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
}

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const requestedConversation = searchParams.get("conversation");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(requestedConversation);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesViewportRef = useChatAutoScroll({
    conversationId: selectedId,
    latestMessageId: messages.at(-1)?.id || null,
    loading: loadingMessages,
    sending,
  });

  const selected = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId],
  );

  const loadConversations = useCallback(async () => {
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    if (unreadOnly) query.set("unread", "true");
    const response = await fetch(`/api/admin/chat/conversations?${query}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể tải hộp thư.");
    setConversations(data.conversations || []);
  }, [search, unreadOnly]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tải tin nhắn.");
      setMessages(data.messages || []);
      await fetch(`/api/chat/conversations/${conversationId}/read`, { method: "POST" });
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingList(true);
      loadConversations().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Không thể tải hộp thư.")).finally(() => setLoadingList(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    void loadMessages(selectedId).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Không thể tải tin nhắn."));
  }, [loadMessages, selectedId]);

  useEffect(() => {
    const events = new EventSource("/api/chat/events?scope=admin");
    const refresh = () => {
      void loadConversations();
      if (selectedId) void loadMessages(selectedId);
    };
    events.addEventListener("update", refresh);
    return () => {
      events.removeEventListener("update", refresh);
      events.close();
    };
  }, [loadConversations, loadMessages, selectedId]);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const chooseImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Ảnh chat phải đúng định dạng và không quá 5 MB.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    const text = content.trim();
    if (!selectedId || sending || (!text && !selectedImage)) return;
    setSending(true);
    setError("");
    try {
      let imageUrl: string | null = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("file", selectedImage);
        formData.append("bucket", "chat");
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.error || "Không thể tải ảnh lên.");
        imageUrl = uploadData.url;
      }

      const response = await fetch(`/api/chat/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text || null, imageUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể gửi tin nhắn.");
      setContent("");
      clearImage();
      await Promise.all([loadMessages(selectedId), loadConversations()]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    if (!selected) return;
    const status = selected.status === "OPEN" ? "CLOSED" : "OPEN";
    const response = await fetch(`/api/admin/chat/conversations/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Không thể cập nhật hội thoại.");
      return;
    }
    await loadConversations();
  };

  return (
    <div className={cn("overflow-hidden rounded-card border border-border bg-white shadow-floating lg:grid lg:h-[calc(100dvh-9.5rem)] lg:min-h-[620px] lg:grid-cols-[360px_minmax(0,1fr)]", selectedId ? "h-[calc(100dvh-81px)]" : "min-h-[520px]")}>
      <aside className={cn("h-full border-r border-border bg-muted/35 lg:min-h-0", selectedId && "hidden lg:flex lg:flex-col")}>
        <div className="border-b border-[#e4eadf] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#23341c]">Hộp thư tư vấn</h2>
              <p className="mt-0.5 text-xs text-[#718069]">Chat sản phẩm với khách hàng</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-md bg-[#e9f1e4] text-primary"><Inbox className="h-4.5 w-4.5" /></div>
          </div>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8977]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm khách hoặc sản phẩm" className="h-12 w-full rounded-md border border-[#d9e2d3] bg-white pl-9 pr-3 text-base outline-none focus:border-[#789568] focus:ring-2 focus:ring-[#e1ecda] sm:text-sm" />
          </div>
          <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2 text-xs font-semibold text-[#53644b]">
            <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} className="h-4 w-4 accent-primary" />
            Chỉ hiện tin chưa đọc
          </label>
        </div>

        <div className="max-h-[calc(100dvh-19rem)] overflow-y-auto lg:max-h-none lg:flex-1">
          {loadingList ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-[#718069]"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải hội thoại</div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-16 text-center"><MessageSquare className="mx-auto h-8 w-8 text-[#a5b19f]" /><p className="mt-3 text-sm font-semibold text-[#53644b]">Chưa có hội thoại phù hợp</p></div>
          ) : conversations.map((conversation) => {
            const last = conversation.messages[0];
            return (
              <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={cn("flex min-h-20 w-full gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-primary-soft", selectedId === conversation.id && "bg-primary-soft")}>
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#e3eadf] text-sm font-bold text-primary">
                  {conversation.product?.image ? <img src={conversation.product.image} alt="" className="h-full w-full object-cover" /> : (conversation.customer.name || conversation.customer.email).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="truncate text-sm font-bold text-[#26361f]">{conversation.customer.name || conversation.customer.email}</p><span className="ml-auto shrink-0 text-[11px] text-[#84907e]">{relativeTime(conversation.lastMessageAt)}</span></div>
                  <p className="mt-0.5 truncate text-xs font-medium text-[#617058]">{conversation.order ? `Đơn hàng #${conversation.order.orderNumber}` : conversation.product?.name || "Sản phẩm không còn tồn tại"}</p>
                  <div className="mt-1 flex items-center gap-2"><p className={cn("truncate text-xs", conversation.adminUnreadCount ? "font-semibold text-[#344c2a]" : "text-[#84907e]")}>{last?.senderType === "ADMIN" ? "Bạn: " : ""}{last?.content || (last?.imageUrl ? "Đã gửi một ảnh" : "Chưa có tin nhắn")}</p>{conversation.adminUnreadCount > 0 && <span className="ml-auto grid min-w-5 shrink-0 place-items-center rounded-full bg-[#d93434] px-1.5 py-0.5 text-[10px] font-bold text-white">{conversation.adminUnreadCount > 99 ? "99+" : conversation.adminUnreadCount}</span>}</div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className={cn("min-h-[620px] min-w-0 flex-col lg:min-h-0", selectedId ? "flex" : "hidden lg:flex")}>
        {!selected ? (
          <div className="grid flex-1 place-items-center bg-[#fbfcfa] px-8 text-center"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e8f0e3] text-primary"><MessageSquare className="h-6 w-6" /></div><h2 className="mt-4 font-bold text-[#26361f]">Chọn một cuộc trò chuyện</h2><p className="mt-1 text-sm text-[#73806d]">Tin nhắn và thông tin sản phẩm sẽ hiện tại đây.</p></div></div>
        ) : (
          <>
            <header className="flex min-h-16 items-center gap-3 border-b border-[#e4eadf] px-3 py-2.5 sm:px-4">
              <button type="button" onClick={() => setSelectedId(null)} className="grid h-11 w-11 shrink-0 place-items-center rounded-control text-muted-foreground hover:bg-primary-soft hover:text-primary lg:hidden" aria-label="Quay lại danh sách"><ArrowLeft className="h-4.5 w-4.5" /></button>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#26361f]">{selected.customer.name || selected.customer.email}</p><p className="truncate text-xs text-[#73806d]">{selected.order ? `Đơn hàng #${selected.order.orderNumber} · ` : ""}{selected.customer.email}{selected.customer.phone ? ` · ${selected.customer.phone}` : ""}</p></div>
              {selected.product && <Link href={selected.product.href} target="_blank" rel="noopener noreferrer" className="grid h-11 w-11 shrink-0 place-items-center rounded-control border border-border text-muted-foreground hover:bg-primary-soft hover:text-primary" aria-label="Mở sản phẩm" title="Mở sản phẩm"><ExternalLink className="h-4 w-4" /></Link>}
              <button type="button" onClick={toggleStatus} className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-md border", selected.status === "OPEN" ? "border-[#ead1d1] text-red-600 hover:bg-red-50" : "border-primary-border text-primary hover:bg-primary-soft")} aria-label={selected.status === "OPEN" ? "Đóng hội thoại" : "Mở lại hội thoại"} title={selected.status === "OPEN" ? "Đóng hội thoại" : "Mở lại hội thoại"}>{selected.status === "OPEN" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</button>
            </header>

            <div className="flex items-center gap-3 border-b border-[#edf1ea] bg-[#f8faf6] px-4 py-2.5">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#e5ece0]">{selected.product?.image ? <img src={selected.product.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><MessageSquare className="h-4 w-4 text-[#617058]" /></div>}</div>
              <div className="min-w-0"><p className="truncate text-xs font-bold text-[#33452b]">{selected.product?.name || "Sản phẩm không còn tồn tại"}</p><p className="mt-0.5 text-[11px] text-[#788472]">{selected.product?.type === "MARKETPLACE" ? "Marketplace" : "Sản phẩm cửa hàng"}</p></div>
            </div>

            <div ref={messagesViewportRef} style={{ overflowAnchor: "none" }} className="min-h-0 flex-1 overflow-y-auto bg-muted/25 px-3 py-4 sm:px-5">
              {loadingMessages ? <div className="flex h-full items-center justify-center gap-2 text-sm text-[#718069]"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải tin nhắn</div> : messages.length === 0 ? <div className="grid h-full place-items-center text-sm text-[#84907e]">Khách chưa gửi tin nhắn đầu tiên.</div> : <div className="space-y-3">{messages.map((message) => {
                const mine = message.senderType === "ADMIN";
                return <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}><div className="max-w-[82%]"><div className={cn("overflow-hidden rounded-tile border text-sm leading-6", mine ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground")}>{message.imageUrl && <a href={message.imageUrl} target="_blank" rel="noreferrer" className="block bg-black/5"><img src={message.imageUrl} alt="Ảnh trong cuộc trò chuyện" className="max-h-80 w-full object-contain" /></a>}{message.content && <p className="whitespace-pre-wrap break-words px-3.5 py-2.5">{message.content}</p>}</div><p className={cn("mt-1 px-1 text-[11px] text-muted-foreground", mine && "text-right")}>{mine ? "Admin" : selected.customer.name || "Khách"} · {messageTime(message.createdAt)}</p></div></div>;
              })}</div>}
            </div>

            <footer className="border-t border-[#e4eadf] bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {imagePreview && <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-md border border-[#cedbc7]"><img src={imagePreview} alt="Ảnh chuẩn bị gửi" className="h-full w-full object-cover" /><button type="button" onClick={clearImage} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-full bg-black/75 text-white" aria-label="Bỏ ảnh"><X className="h-4 w-4" /></button></div>}
              {error && <p className="mb-2 text-xs font-medium text-red-700">{error}</p>}
              <div className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending} className="grid h-12 w-12 shrink-0 place-items-center rounded-control border border-border text-foreground hover:bg-primary-soft hover:text-primary disabled:opacity-50" aria-label="Gửi ảnh" title="Gửi ảnh"><ImagePlus className="h-5 w-5" /></button>
                <textarea value={content} onChange={(event) => setContent(event.target.value.slice(0, 2000))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} placeholder={selected.status === "CLOSED" ? "Trả lời để mở lại hội thoại..." : "Nhập nội dung trả lời..."} className="min-h-12 max-h-28 flex-1 resize-none rounded-md border border-[#d7e0d1] bg-white px-3 py-2.5 text-base outline-none focus:border-[#799768] focus:ring-2 focus:ring-[#e2ecdc]" />
                <button type="button" onClick={() => void sendMessage()} disabled={sending || (!content.trim() && !selectedImage)} className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-primary text-white hover:bg-primary-hover disabled:bg-disabled" aria-label="Gửi tin nhắn" title="Gửi tin nhắn">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
