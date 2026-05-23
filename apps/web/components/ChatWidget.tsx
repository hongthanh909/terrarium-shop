"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle, X, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    try {
      // TODO: Integrate with your backend or third-party service
      // const res = await fetch("/api/chat", { ... });

      // Demo: just log and clear
      console.log("Chat message:", message);
      setMessage("");

      // Nếu dùng third-party như Tidio/Botpress, gọi API của họ ở đây
    } catch (error) {
      console.error("Failed to send message:", error);
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
            <div className="h-64 flex flex-col">
              {/* Messages area */}
              <div className="flex-1 bg-[#f0f4ec] rounded-xl p-4 mb-4 overflow-y-auto">
                <div className="text-center text-sm text-[hsl(220,14%,45%)] py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-[#425733]/50" />
                  <p className="font-medium mb-1">Chào bạn! 👋</p>
                  <p className="text-xs">
                    Hãy chia sẻ nhu cầu của bạn, chúng tôi sẽ tư vấn trong thời gian sớm nhất.
                  </p>
                </div>
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

              {/* Alternative contact */}
              <div className="mt-4 text-center">
                <p className="text-xs text-[hsl(220,14%,45%)]">
                  Hoặc gọi trực tiếp:{" "}
                  <a href="tel:0909xxx" className="font-bold text-[#425733]">
                    0909.xxx.xxx
                  </a>
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
