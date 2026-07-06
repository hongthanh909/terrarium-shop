"use client";

import { useState } from "react";
import { Send, Sprout, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ConsultPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý ảo của Terrarium Shop. Tôi có thể giúp gì cho bạn về chăm sóc cây hoặc gợi ý sản phẩm?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "Xin lỗi, tôi chưa hiểu câu hỏi của bạn." },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[hsl(0,0%,100%)] py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#e3ebdd] mb-4">
            <Sprout className="w-8 h-8 text-[#425733]" />
          </div>
          <h1 className="text-3xl font-bold text-[hsl(220,14%,25%)] mb-2">Tư Vấn</h1>
          <p className="text-[hsl(220,14%,45%)]">
            Hỏi về chăm sóc cây, gợi ý sản phẩm và nhiều hơn nữa
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#e3ebdd] overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-[#e3ebdd]"
                      : "bg-[#425733]"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-[#425733]" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-[#e3ebdd] text-[hsl(220,14%,25%)]"
                      : "bg-[hsl(220,14%,96%)] text-[hsl(220,14%,25%)]"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#425733] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[hsl(220,14%,96%)] rounded-2xl px-4 py-3">
                  <p className="text-sm text-[hsl(220,14%,45%)]">Đang suy nghĩ...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-[#e3ebdd]">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Nhập câu hỏi của bạn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 rounded-full border-[#c8d5be] focus:border-[#425733] focus:ring-[#e3ebdd]"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-full bg-[#425733] hover:bg-[#364a29]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Suggested Questions */}
        <div className="mt-8">
          <p className="text-sm text-[hsl(220,14%,45%)] text-center mb-4">
            Câu hỏi gợi ý:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Làm sao để chăm sóc terrarium?",
              "Cây nào phù hợp cho phòng tối?",
              "Tưới nước bao lâu một lần?",
              "Terrarium cần ánh sáng không?",
            ].map((question) => (
              <button
                key={question}
                onClick={() => setInput(question)}
                className="px-4 py-2 bg-[#f0f4ec] rounded-full text-sm text-[hsl(220,14%,45%)] hover:bg-[#e3ebdd] transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
