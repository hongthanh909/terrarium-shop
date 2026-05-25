"use client";

import { useEffect, useState } from "react";
import { Leaf, Mail, Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ContactInfo {
  id: string;
  type: string;
  label: string;
  value: string;
  orderIndex: number;
  metadata?: any;
}

export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/contact")
      .then((res) => res.json())
      .then((data) => {
        setContactInfo(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitMessage({ type: "success", text: "Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể!" });
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setSubmitMessage({ type: "error", text: "Có lỗi xảy ra. Vui lòng thử lại sau." });
      }
    } catch (error) {
      setSubmitMessage({ type: "error", text: "Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối." });
    } finally {
      setSubmitting(false);
    }
  };

  const emails = contactInfo.filter((c) => c.type === "email");
  const phones = contactInfo.filter((c) => c.type === "phone");
  const addresses = contactInfo.filter((c) => c.type === "address");
  const workingHours = contactInfo.filter((c) => c.type === "working_hours");

  return (
    <main className="min-h-screen bg-[hsl(0,0%,100%)] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-[#425733] flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-[#ffffff]" />
          </div>
          <h1 className="text-4xl font-bold text-[hsl(220,14%,25%)] mb-4">Liên Hệ</h1>
          <p className="text-[hsl(220,14%,45%)] max-w-2xl mx-auto">
            Bạn có câu hỏi hoặc cần tư vấn? Chúng tôi luôn sẵn sàng hỗ trợ bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[hsl(220,14%,25%)] mb-6">Thông Tin Liên Hệ</h2>
              <div className="space-y-4">
                {emails.length > 0 && (
                  <div className="flex items-start gap-4 p-4 bg-[#f0f4ec] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-[#425733] flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-[#ffffff]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[hsl(220,14%,25%)]">Email</h3>
                      {emails.map((item, idx) => (
                        <a key={idx} href={`mailto:${item.value}`} className="text-[hsl(220,14%,45%)] hover:text-[#425733]">
                          {item.value}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {phones.length > 0 && (
                  <div className="flex items-start gap-4 p-4 bg-[#f0f4ec] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-[#425733] flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#ffffff]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[hsl(220,14%,25%)]">Hotline</h3>
                      {phones.map((item, idx) => (
                        <p key={idx} className="text-[hsl(220,14%,45%)]">{item.value}</p>
                      ))}
                    </div>
                  </div>
                )}

                {addresses.length > 0 && (
                  <div className="flex items-start gap-4 p-4 bg-[#f0f4ec] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-[#425733] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#ffffff]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[hsl(220,14%,25%)]">Địa chỉ</h3>
                      {addresses.map((item, idx) => (
                        <p key={idx} className="text-[hsl(220,14%,45%)]">{item.value}</p>
                      ))}
                    </div>
                  </div>
                )}

                {workingHours.length > 0 && (
                  <div className="flex items-start gap-4 p-4 bg-[#f0f4ec] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-[#425733] flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-[#ffffff]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[hsl(220,14%,25%)]">Giờ làm việc</h3>
                      {workingHours.map((item, idx) => (
                        <p key={idx} className="text-[hsl(220,14%,45%)]">{item.value}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="rounded-2xl overflow-hidden h-64">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5!2d106.7!3d10.77!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzEyLjAiTiAxMDbCsDQyJzAwLjAiRQ!5e0!3m2!1svi!2svn!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vị trí Tiệm Rêu Decor"
              />
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-[hsl(220,14%,25%)] mb-6">Gửi Tin Nhắn</h2>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-soft">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1 text-[hsl(220,14%,25%)]">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border-[#c8d5be]"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1 text-[hsl(220,14%,25%)]">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border-[#c8d5be]"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1 text-[hsl(220,14%,25%)]">
                  Tiêu đề
                </label>
                <Input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-xl border-[#c8d5be]"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1 text-[hsl(220,14%,25%)]">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-xl border-[#c8d5be] resize-none"
                />
              </div>

              {submitMessage && (
                <div
                  className={`p-4 rounded-xl ${
                    submitMessage.type === "success"
                      ? "bg-[#e3ebdd] text-[#425733]"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#425733] hover:bg-[#364a29] text-white font-semibold py-6 rounded-xl"
              >
                {submitting ? "Đang gửi..." : "Gửi tin nhắn"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
