import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  let policy: any = null;
  try {
    policy = await prisma.policy.findUnique({
      where: { slug: (await params).slug },
      select: { title: true },
    });
  } catch {}
  return {
    title: policy?.title || "Chính Sách",
    description: `Chính sách ${policy?.title || ""} của Tiệm Rêu Décor`,
  };
}

export default async function PolicyDetailPage({ params }: Props) {
  let policy: any = null;

  try {
    policy = await prisma.policy.findUnique({
      where: { slug: (await params).slug, isActive: true },
    });
  } catch (error) {
    console.error("[PolicyDetail] DB error:", error);
  }

  if (!policy) {
    notFound();
  }

  const safeContent = sanitizeHtml(policy.content);

  return (
    <main className="min-h-screen bg-[hsl(0,0%,100%)] py-8 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href="/policies"
          className="inline-flex items-center text-[#425733] hover:text-[#364a29] mb-6 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tất cả chính sách
        </Link>

        {/* Policy Content */}
        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#e3ebdd] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#425733]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
                  {policy.title}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cập nhật lần cuối:{" "}
                  {new Date(policy.updatedAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </header>

          <div
            className="prose prose-emerald max-w-none text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        </article>

        {/* Divider */}
        <hr className="my-12 border-gray-100" />

        {/* Back to all policies */}
        <div className="text-center">
          <Link
            href="/policies"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Xem Tất Cả Chính Sách
          </Link>
        </div>
      </div>
    </main>
  );
}
