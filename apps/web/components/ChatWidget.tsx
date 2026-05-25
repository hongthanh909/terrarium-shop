"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Chào bạn! 👋 Tôi có thể tư vấn về terrarium, chăm sóc cây, hoặc giúp bạn chọn sản phẩm." },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMsg = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsSending(true);

    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "Xin lỗi, tôi chưa hiểu câu hỏi." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-soft-xl bg-[#425733] hover:bg-[#4d6b3d] hover:shadow-soft-2xl z-50 transition-all duration-300 group"
        aria-label="Open chat consultation"
      >
        <MessageCircle className="w-6 h-6 text-[#ffffff] group-hover:scale-110 transition-transform" />
      </Button>

      {/* Chat dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-soft-xl border-0 p-0 overflow-hidden">
          <DialogHeader className="bg-[#425733] px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-[#ffffff] font-bold">
              <MessageCircle className="w-5 h-5" />
              Tư vấn trực tiếp
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <div className="flex flex-col" style={{ height: "320px" }}>
              {/* Messages area */}
              <div className="flex-1 bg-[#f0f4ec] rounded-xl p-4 mb-4 overflow-y-auto space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-[#425733] text-white rounded-br-sm"
                          : "bg-white text-[hsl(220,14%,25%)] rounded-bl-sm shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm shadow-sm text-[hsl(220,14%,45%)]">
                      Đang trả lời...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="flex-1 resize-none rounded-xl border-[#c8d5be] focus:border-[#425733] text-sm"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={isSending || !message.trim()}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-[#425733] hover:bg-[#4d6b3d]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
