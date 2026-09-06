import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomerReview {
  id: string;
  name: string;
  productName: string;
  productSlug: string;
  rating: number;
  content: string;
  verified: boolean;
}

export function ReviewMarquee({ reviews, className }: { reviews: CustomerReview[]; className?: string }) {
  if (!reviews.length) return null;

  return (
    <section className={cn("border-t border-border bg-background px-4 py-10 sm:px-6 sm:py-16", className)} aria-labelledby="customer-reviews-title">
      <div className="mx-auto max-w-7xl">
        <h2 id="customer-reviews-title" className="mb-6 text-2xl font-bold text-foreground sm:mb-8 sm:text-3xl">
          Khách hàng chia sẻ
        </h2>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                  {review.name.trim().slice(0, 1).toLocaleUpperCase("vi-VN")}
                </span>
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold">{review.name}</h3>
                  {review.verified && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />Đã mua hàng</p>}
                </div>
              </div>
              <div className="flex gap-1" role="img" aria-label={`${review.rating} trên 5 sao`}>
                {Array.from({ length: 5 }, (_, index) => <Star key={index} aria-hidden="true" className={cn("h-4 w-4", index < review.rating ? "fill-rating text-rating" : "text-border-strong")} />)}
              </div>
              <p className="whitespace-pre-line break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">{review.content.length > 280 ? `${review.content.slice(0, 280)}…` : review.content}</p>
              <Link href={`/products/${review.productSlug}#reviews`} className="mt-auto inline-flex min-h-11 items-center gap-2 break-words border-t border-border pt-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                {review.productName}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
