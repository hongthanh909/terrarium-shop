"use client";

import { useEffect, useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ContactInfo {
  id: string;
  type: string;
  label: string;
  value: string;
  orderIndex: number;
}

const fallbackInfo: ContactInfo[] = [
  { id: "email", type: "email", label: "Email", value: "tiemreudecor@gmail.com", orderIndex: 1 },
  { id: "address", type: "address", label: "Địa chỉ", value: "Long Trường, Hồ Chí Minh", orderIndex: 2 },
  { id: "hours", type: "working_hours", label: "Giờ làm việc", value: "Thứ 2 - Chủ nhật: 9:00 - 21:00", orderIndex: 3 },
];

const contactIcons = {
  email: Mail,
  phone: Phone,
  address: MapPin,
  working_hours: Clock,
};

export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/contact", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setContactInfo(Array.isArray(data) ? data : []))
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setContactInfo([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) throw new Error(payload?.error || "Không thể gửi tin nhắn");

      setSubmitMessage({
        type: "success",
        text: "Tiệm Rêu đã nhận được tin nhắn và sẽ phản hồi sớm nhất có thể.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const visibleInfo = contactInfo.length > 0 ? contactInfo : fallbackInfo;

  return (
    <div className="min-h-[100dvh] bg-white px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-border pb-9 sm:mb-12 sm:pb-11">
          <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Kết nối với Tiệm Rêu</p>
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Chúng tôi sẵn sàng lắng nghe
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Gửi câu hỏi về sản phẩm, chăm sóc terrarium hoặc đơn hàng. Tiệm Rêu sẽ phản hồi qua email bạn cung cấp.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <section aria-labelledby="contact-form-title">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Gửi yêu cầu</p>
                <h2 id="contact-form-title" className="mt-2 font-serif text-3xl font-semibold text-foreground">
                  Nhắn cho Tiệm Rêu
                </h2>
              </div>
              <Send className="hidden h-6 w-6 text-muted-foreground sm:block" aria-hidden="true" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-[#f7f8f6] p-5 sm:p-7">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-foreground">
                  Họ và tên <span className="text-red-600">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  className="min-h-12 rounded-md border-border bg-white px-3 text-base"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-foreground">
                  Email <span className="text-red-600">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  maxLength={160}
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  className="min-h-12 rounded-md border-border bg-white px-3 text-base"
                />
              </div>

              <div>
                <label htmlFor="subject" className="mb-1.5 block text-sm font-semibold text-foreground">Tiêu đề</label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  maxLength={160}
                  value={formData.subject}
                  onChange={(event) => setFormData((current) => ({ ...current, subject: event.target.value }))}
                  className="min-h-12 rounded-md border-border bg-white px-3 text-base"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-foreground">
                  Nội dung <span className="text-red-600">*</span>
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  minLength={5}
                  maxLength={5000}
                  rows={6}
                  value={formData.message}
                  onChange={(event) => setFormData((current) => ({ ...current, message: event.target.value }))}
                  className="resize-y rounded-md border-border bg-white px-3 py-3 text-base"
                />
              </div>

              {submitMessage && (
                <div
                  role={submitMessage.type === "error" ? "alert" : "status"}
                  aria-live="polite"
                  className={`rounded-md border p-4 text-sm leading-6 ${
                    submitMessage.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="min-h-12 w-full rounded-md bg-foreground text-sm font-semibold text-white hover:bg-foreground/85"
              >
                {submitting ? "Đang gửi..." : "Gửi tin nhắn"}
              </Button>
            </form>
          </section>

          <aside aria-labelledby="contact-info-title">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Thông tin cửa hàng</p>
            <h2 id="contact-info-title" className="mt-2 font-serif text-3xl font-semibold text-foreground">
              Liên hệ trực tiếp
            </h2>

            <div className="mt-6 border-y border-border">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex min-h-24 items-center gap-4 border-t border-border first:border-t-0">
                      <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))
                : visibleInfo.map((item) => {
                    const Icon = contactIcons[item.type as keyof typeof contactIcons] || Mail;
                    const href = item.type === "email" ? `mailto:${item.value}` : item.type === "phone" ? `tel:${item.value.replace(/\s/g, "")}` : null;
                    const value = href ? (
                      <a href={href} className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground">
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.value}</p>
                    );

                    return (
                      <div key={item.id} className="flex min-h-24 items-start gap-4 border-t border-border py-5 first:border-t-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-white text-foreground">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">{item.label || "Thông tin"}</h3>
                          {value}
                        </div>
                      </div>
                    );
                  })}
            </div>

            <div className="mt-8 h-64 overflow-hidden rounded-lg border border-border bg-muted sm:h-72">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5!2d106.7!3d10.77!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzEyLjAiTiAxMDbCsDQyJzAwLjAiRQ!5e0!3m2!1svi!2svn!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vị trí Tiệm Rêu Décor"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
