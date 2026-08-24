export default function ExploreLoading() {
  return (
    <div className="min-h-[100dvh] bg-white px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 border-b border-border pb-8">
          <div className="mb-4 h-3 w-40 animate-pulse rounded bg-muted" />
          <div className="h-12 max-w-2xl animate-pulse rounded-md bg-muted sm:h-14" />
          <div className="mt-4 h-5 max-w-xl animate-pulse rounded bg-muted" />
        </div>

        <div className="grid overflow-hidden rounded-lg border border-border bg-[#f7f8f6] lg:grid-cols-[1.35fr_0.65fr]">
          <div className="min-h-[310px] animate-pulse bg-muted sm:min-h-[460px] lg:min-h-[520px]" />
          <div className="space-y-5 p-6 sm:p-10">
            <div className="h-10 w-10 animate-pulse rounded-md bg-white" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
            <div className="mt-12 h-12 w-40 animate-pulse rounded-md bg-foreground/10" />
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-10">
          <div className="mb-8 h-9 w-64 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-border bg-white">
                <div className="aspect-square animate-pulse bg-muted" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
