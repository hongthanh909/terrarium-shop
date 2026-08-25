import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

const getPolicy = cache(async (slug: string) => {
  try {
    return await prisma.policy.findUnique({
      where: { slug, isActive: true },
    });
  } catch (error) {
    console.error("[PolicyDetail] DB error:", error);
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = await getPolicy(slug);
  const title = policy?.title || "Chính sách";

  return {
    title: { absolute: `${title} | Tiệm Rêu Décor` },
    description: `Thông tin ${title.toLocaleLowerCase("vi-VN")} của Tiệm Rêu Décor.`,
    alternates: { canonical: `/policies/${slug}` },
    openGraph: {
      title: `${title} | Tiệm Rêu Décor`,
      description: `Thông tin ${title.toLocaleLowerCase("vi-VN")} của Tiệm Rêu Décor.`,
      url: `/policies/${slug}`,
      type: "article",
    },
  };
}

export default async function PolicyDetailPage({ params }: Props) {
  const { slug } = await params;
  const policy = await getPolicy(slug);

  if (!policy) notFound();

  const safeContent = sanitizeHtml(policy.content);

  return (
    <div className="min-h-[100dvh] bg-white px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/policies"
          className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tất cả chính sách
        </Link>

        <article className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-[#f7f8f6] text-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase text-muted-foreground">Chính sách Tiệm Rêu</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Nội dung được quản trị viên cập nhật trực tiếp để phản ánh chính sách hiện hành.
            </p>
          </aside>

          <div className="min-w-0">
            <header className="border-b border-border pb-8 sm:pb-10">
              <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
                {policy.title}
              </h1>
              <p className="mt-4 text-sm text-muted-foreground">
                Cập nhật lần cuối: {new Date(policy.updatedAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </header>

            <div
              className="prose prose-neutral mt-9 max-w-none text-muted-foreground prose-headings:font-serif prose-headings:font-semibold prose-headings:text-foreground prose-a:text-foreground prose-strong:text-foreground prose-li:marker:text-muted-foreground sm:mt-11"
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />

            <section className="mt-12 border-t border-border pt-8">
              <div className="flex flex-col gap-5 rounded-lg border border-border bg-[#f7f8f6] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <MessageCircle className="h-5 w-5" />
                    Bạn vẫn còn thắc mắc?
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Liên hệ Tiệm Rêu để được tư vấn theo trường hợp cụ thể.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-semibold text-white transition-colors hover:bg-foreground/85"
                >
                  Liên hệ hỗ trợ
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
