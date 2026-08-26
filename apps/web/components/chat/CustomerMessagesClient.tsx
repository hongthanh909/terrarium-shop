"use client";

/* eslint-disable @next/next/no-img-element -- Chat images are user-generated storage URLs. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Inbox,
  Loader2,
  MessageCircle,
  Send,
  ShoppingBag,
  X,
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
  customerUnreadCount: number;
  lastMessageAt: string;
  product: {
    id: string;
    type: "CATALOG" | "MARKETPLACE";
    name: string;
    image: string | null;
    href: string;
  } | null;
  order: { id: string; orderNumber: string; shippingQuoteRequired: boolean } | null;
  messages: ChatMessage[];
};

function relativeTime(value: string) {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function messageTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export function CustomerMessagesClient() {
  const searchParams = useSearchParams();
  const requestedConversation = searchParams.get("conversation");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(requestedConversation);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
    const response = await fetch("/api/chat/conversations", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể tải lịch sử tin nhắn.");
    setConversations(data.conversations || []);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tải tin nhắn.");
      setMessages(data.messages || []);
      await fetch(`/api/chat/conversations/${conversationId}/read`, { method: "POST" });
      setConversations((current) => current.map((item) => (
        item.id === conversationId ? { ...item, customerUnreadCount: 0 } : item
      )));
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    setLoadingList(true);
    loadConversations()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Không thể tải lịch sử tin nhắn."))
      .finally(() => setLoadingList(false));
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    void loadMessages(selectedId).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải tin nhắn.");
    });
  }, [loadMessages, selectedId]);

  useEffect(() => {
    const events = new EventSource("/api/chat/events?scope=customer");
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

  return (
    <div className={cn("min-h-[calc(100dvh-57px)] bg-white px-4 py-5 sm:px-5 sm:py-10", selectedId && "px-0 py-0 sm:px-5 sm:py-10")}>
      <div className="mx-auto max-w-[1400px]">
        <header className={cn("mb-5 flex items-end justify-between gap-4 border-b border-border pb-5", selectedId && "hidden lg:flex")}>
          <div>
            <Link href="/profile" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Tài khoản
            </Link>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground sm:mt-2 sm:text-4xl">Tin nhắn với admin</h1>
            <p className="mt-2 text-sm text-muted-foreground">Xem lại tư vấn và tiếp tục trao đổi theo từng sản phẩm.</p>
          </div>
          <div className="hidden h-11 w-11 place-items-center border border-border bg-muted text-foreground sm:grid">
            <Inbox className="h-5 w-5" />
          </div>
        </header>

        <div className={cn("overflow-hidden border border-border bg-white shadow-floating sm:rounded-card lg:grid lg:h-[calc(100dvh-14rem)] lg:min-h-[620px] lg:grid-cols-[350px_minmax(0,1fr)]", selectedId ? "h-[calc(100dvh-57px)] border-x-0 sm:h-[calc(100dvh-14rem)] sm:border-x" : "min-h-[480px]")}>
          <aside className={cn("h-full border-r border-border bg-muted/35 lg:min-h-0", selectedId && "hidden lg:flex lg:flex-col")}>
            <div className="border-b border-border px-4 py-4">
              <h2 className="text-sm font-bold text-foreground">Các cuộc trò chuyện</h2>
              <p className="mt-1 text-xs text-muted-foreground">Lịch sử được lưu theo tài khoản của bạn</p>
            </div>
            <div className="max-h-[calc(100dvh-19rem)] overflow-y-auto lg:max-h-none lg:flex-1">
              {loadingList ? (
                <div className="space-y-3 p-4" aria-label="Đang tải hội thoại">
                  {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse bg-muted" />)}
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-7 py-16 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-3 text-sm font-bold text-foreground">Bạn chưa có cuộc trò chuyện</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Mở một sản phẩm và chọn “Chat với admin” để bắt đầu.</p>
                  <Link href="/products" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
                    <ShoppingBag className="h-4 w-4" /> Xem sản phẩm
                  </Link>
                </div>
              ) : conversations.map((conversation) => {
                const last = conversation.messages[0];
                return (
                  <button key={conversation.id} type="button" onClick={() => { setError(""); setSelectedId(conversation.id); }} className={cn("flex min-h-20 w-full gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-primary-soft", selectedId === conversation.id && "bg-primary-soft")}>
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-tile border border-border bg-white text-primary">
                      {conversation.product?.image ? <img src={conversation.product.image} alt="" className="h-full w-full object-cover" /> : <MessageCircle className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">{conversation.order ? `Đơn hàng #${conversation.order.orderNumber}` : conversation.product?.name || "Sản phẩm không còn tồn tại"}</p>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{relativeTime(conversation.lastMessageAt)}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {last?.senderType === "CUSTOMER" ? "Bạn: " : "Admin: "}{last?.content || (last?.imageUrl ? "Đã gửi một ảnh" : "Chưa có tin nhắn")}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">{conversation.order ? "Trao đổi phí vận chuyển" : conversation.product?.type === "MARKETPLACE" ? "Marketplace" : "Sản phẩm cửa hàng"}</span>
                        {conversation.customerUnreadCount > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#d93434] px-1.5 py-0.5 text-xs font-bold text-white">{conversation.customerUnreadCount > 99 ? "99+" : conversation.customerUnreadCount}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className={cn("h-full min-w-0 flex-col lg:min-h-0", selectedId ? "flex" : "hidden lg:flex")}>
            {!selected ? (
              <div className="grid flex-1 place-items-center bg-white px-8 text-center">
                <div><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted text-foreground"><MessageCircle className="h-6 w-6" /></div><h2 className="mt-4 font-bold text-foreground">Chọn một cuộc trò chuyện</h2><p className="mt-1 text-sm text-muted-foreground">Nội dung tư vấn và ảnh đã gửi sẽ hiện tại đây.</p></div>
              </div>
            ) : (
              <>
                <header className="flex min-h-16 items-center gap-3 border-b border-border px-3 py-2.5 sm:px-4">
                  <button type="button" onClick={() => setSelectedId(null)} className="grid h-11 w-11 shrink-0 place-items-center text-muted-foreground hover:bg-muted lg:hidden" aria-label="Quay lại danh sách"><ArrowLeft className="h-4.5 w-4.5" /></button>
                   <div className="h-10 w-10 shrink-0 overflow-hidden rounded-control bg-primary-soft">{selected.product?.image ? <img src={selected.product.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><MessageCircle className="h-4 w-4 text-primary" /></div>}</div>
                   <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{selected.order ? `Đơn hàng #${selected.order.orderNumber}` : selected.product?.name || "Sản phẩm không còn tồn tại"}</p><p className="truncate text-xs text-muted-foreground">{selected.order ? "Trao đổi phí vận chuyển với admin" : "Tư vấn trực tiếp với admin"}</p></div>
                   {selected.product && <Link href={selected.product.href} className="grid h-11 w-11 shrink-0 place-items-center rounded-control border border-border text-foreground hover:bg-primary-soft hover:text-primary" aria-label="Mở sản phẩm" title="Mở sản phẩm"><ExternalLink className="h-4 w-4" /></Link>}
                </header>

                <div ref={messagesViewportRef} style={{ overflowAnchor: "none" }} className="min-h-0 flex-1 overflow-y-auto bg-muted/25 px-3 py-4 sm:px-5" aria-live="polite">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center gap-2 text-sm text-[#718069]"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải tin nhắn</div>
                  ) : messages.length === 0 ? (
                    <div className="grid h-full place-items-center text-center"><div><MessageCircle className="mx-auto h-7 w-7 text-[#98a692]" /><p className="mt-3 text-sm font-semibold text-[#65715f]">Hãy gửi câu hỏi đầu tiên cho admin.</p></div></div>
                  ) : (
                    <div className="space-y-3">{messages.map((message) => {
                      const mine = message.senderType === "CUSTOMER";
                       return <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}><div className="max-w-[84%]"><div className={cn("overflow-hidden rounded-tile border text-sm leading-6", mine ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground")}>{message.imageUrl && <a href={message.imageUrl} target="_blank" rel="noreferrer" className="block bg-black/5"><img src={message.imageUrl} alt="Ảnh trong cuộc trò chuyện" className="max-h-80 w-full object-contain" /></a>}{message.content && <p className="whitespace-pre-wrap break-words px-3.5 py-2.5">{message.content}</p>}</div><p className={cn("mt-1 px-1 text-xs text-muted-foreground", mine && "text-right")}>{mine ? "Bạn" : "Admin"} · {messageTime(message.createdAt)}</p></div></div>;
                    })}</div>
                  )}
                </div>

                 <footer className="border-t border-border bg-white p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                  {imagePreview && <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-md border border-border"><img src={imagePreview} alt="Ảnh chuẩn bị gửi" className="h-full w-full object-cover" /><button type="button" onClick={clearImage} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-full bg-black/75 text-white" aria-label="Bỏ ảnh"><X className="h-4 w-4" /></button></div>}
                  {error && <p className="mb-2 text-xs font-medium text-red-700">{error}</p>}
                  <div className="flex items-end gap-2">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])} />
                     <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending || loadingMessages} className="grid h-12 w-12 shrink-0 place-items-center rounded-control border border-border text-foreground hover:bg-primary-soft hover:text-primary disabled:opacity-50" aria-label="Gửi ảnh" title="Gửi ảnh"><ImagePlus className="h-5 w-5" /></button>
                     <textarea value={content} onChange={(event) => setContent(event.target.value.slice(0, 2000))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} placeholder={selected.status === "CLOSED" ? "Gửi tin để mở lại hội thoại..." : "Nhập câu hỏi cho admin..."} className="min-h-12 max-h-28 flex-1 resize-none rounded-input border border-border bg-white px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20" />
                     <button type="button" onClick={() => void sendMessage()} disabled={sending || (!content.trim() && !selectedImage)} className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-primary text-white hover:bg-primary-hover disabled:bg-disabled" aria-label="Gửi tin nhắn" title="Gửi tin nhắn">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
