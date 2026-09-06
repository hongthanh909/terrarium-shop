"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ImagePlus, Loader2, MessageCircle, MessagesSquare, Send, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { showToast } from "@/components/ui/custom-toast";
import { useChatAutoScroll } from "@/components/chat/useChatAutoScroll";
import { cn } from "@/lib/utils";

type ChatProductType = "CATALOG" | "MARKETPLACE";

type ChatMessage = {
  id: string;
  senderType: "CUSTOMER" | "ADMIN";
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  sender?: { name: string | null; image: string | null };
};

type ProductAdminChatProps = {
  productType: ChatProductType;
  productId: string;
  productName: string;
  productImage?: string | null;
  buttonLabel?: string;
  buttonClassName?: string;
  compact?: boolean;
};

function messageTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function ProductAdminChat({
  productType,
  productId,
  productName,
  productImage,
  buttonLabel = "Chat với admin",
  buttonClassName,
  compact = false,
}: ProductAdminChatProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesViewportRef = useChatAutoScroll({
    conversationId,
    latestMessageId: messages.at(-1)?.id || null,
    loading,
    sending,
  });

  const loadMessages = useCallback(async (id: string) => {
    const response = await fetch(`/api/chat/conversations/${id}/messages`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể tải tin nhắn.");
    setMessages(data.messages || []);
    void fetch(`/api/chat/conversations/${id}/read`, { method: "POST" });
  }, []);

  const openChat = async () => {
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType, productId }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setOpen(false);
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!response.ok) throw new Error(data.error || "Không thể mở hội thoại.");
      setConversationId(data.conversation.id);
      await loadMessages(data.conversation.id);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Không thể mở hội thoại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !conversationId) return;
    const events = new EventSource(`/api/chat/events?conversationId=${conversationId}`);
    const refresh = () => void loadMessages(conversationId).catch(() => {});
    events.addEventListener("update", refresh);
    return () => {
      events.removeEventListener("update", refresh);
      events.close();
    };
  }, [conversationId, loadMessages, open]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const chooseImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast.error("Vui lòng chọn một file ảnh.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Ảnh chat tối đa 5 MB.");
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
    if (!conversationId || sending || (!text && !selectedImage)) return;
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

      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text || null, imageUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể gửi tin nhắn.");

      setContent("");
      clearImage();
      await loadMessages(conversationId);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "icon" : "lg"}
        className={cn(
          compact
            ? "h-12 w-12 shrink-0 border-border-strong bg-white text-foreground hover:bg-muted"
            : "w-full border-border-strong bg-white text-foreground hover:bg-muted",
          buttonClassName,
        )}
        onClick={openChat}
        aria-label={buttonLabel}
        title={compact ? buttonLabel : undefined}
      >
        <MessageCircle className={cn("h-5 w-5", !compact && "mr-2")} />
        {!compact && buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="mobile-chat-dialog flex h-[min(720px,calc(100dvh-1rem))] w-[calc(100%-1rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-xl border-border bg-background p-0 shadow-floating sm:h-[min(720px,calc(100dvh-3rem))]">
          <DialogTitle className="sr-only">Chat với admin về {productName}</DialogTitle>
          <DialogDescription className="sr-only">Trao đổi trực tiếp với admin và gửi hình ảnh nếu cần.</DialogDescription>

          <header className="flex shrink-0 items-center gap-3 border-b border-border bg-muted/35 px-4 py-3 pr-12">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary-soft">
              {productImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={productImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <MessageCircle className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{productName}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-presence" />
                Chat trực tiếp với admin
              </p>
            </div>
            {conversationId && (
              <Link
                href={`/messages?conversation=${conversationId}`}
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-control px-3 text-xs font-semibold text-muted-foreground hover:bg-primary-soft hover:text-primary"
                title="Xem tất cả tin nhắn"
              >
                <MessagesSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Lịch sử</span>
              </Link>
            )}
            <ShieldCheck className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </header>

          <div ref={messagesViewportRef} style={{ overflowAnchor: "none" }} className="min-h-0 flex-1 overflow-y-auto bg-muted/25 px-4 py-4" aria-live="polite">
            {loading ? (
              <div className="grid h-full place-items-center text-muted-foreground">
                <div className="flex items-center gap-2 text-sm font-medium"><Loader2 className="h-4 w-4 animate-spin" /> Đang mở hội thoại</div>
              </div>
            ) : error && messages.length === 0 ? (
              <div className="grid h-full place-items-center px-6 text-center text-sm text-red-700">{error}</div>
            ) : messages.length === 0 ? (
              <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary"><MessageCircle className="h-5 w-5" /></div>
                <p className="mt-4 font-bold text-foreground">Bạn cần biết thêm điều gì?</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Admin sẽ tư vấn về sản phẩm, cách chăm sóc hoặc hỗ trợ bạn chọn phiên bản phù hợp.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const mine = message.senderType === "CUSTOMER";
                  return (
                    <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[82%]", mine ? "items-end" : "items-start")}>
                        <div className={cn(
                          "overflow-hidden rounded-xl border text-sm leading-6",
                          mine ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground",
                        )}>
                          {message.imageUrl && (
                            <a href={message.imageUrl} target="_blank" rel="noreferrer" className="block bg-black/5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={message.imageUrl} alt="Ảnh trong cuộc trò chuyện" className="max-h-72 w-full object-contain" />
                            </a>
                          )}
                          {message.content && <p className="whitespace-pre-wrap break-words px-3.5 py-2.5">{message.content}</p>}
                        </div>
                        <p className={cn("mt-1 px-1 text-xs text-muted-foreground", mine && "text-right")}>{mine ? "Bạn" : "Admin"} · {messageTime(message.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-border bg-background p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            {imagePreview && (
              <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Ảnh chuẩn bị gửi" className="h-full w-full object-cover" />
                <button type="button" onClick={clearImage} className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/85" aria-label="Bỏ ảnh"><X className="h-4 w-4" /></button>
              </div>
            )}
            {error && messages.length > 0 && <p className="mb-2 text-xs font-medium text-red-700">{error}</p>}
            <div className="flex items-end gap-2">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending || loading} className="grid h-11 w-11 shrink-0 place-items-center rounded-control border border-border text-foreground transition-colors hover:bg-primary-soft hover:text-primary disabled:opacity-50" aria-label="Gửi ảnh" title="Gửi ảnh">
                <ImagePlus className="h-5 w-5" />
              </button>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value.slice(0, 2000))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={1}
                placeholder="Nhập câu hỏi cho admin..."
                className="min-h-11 max-h-28 flex-1 resize-none rounded-input border border-input bg-background px-3 py-2.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={loading || !conversationId}
              />
              <button type="button" onClick={() => void sendMessage()} disabled={sending || loading || !conversationId || (!content.trim() && !selectedImage)} className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-primary text-white transition-colors hover:bg-primary-hover disabled:bg-disabled" aria-label="Gửi tin nhắn" title="Gửi tin nhắn">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  );
}
