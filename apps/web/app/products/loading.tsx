export default function ProductsLoading() {
  return (
    <div className="min-h-[100dvh] bg-white px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Title skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="h-12 w-72 animate-pulse rounded-md bg-muted" />
          <div className="mt-4 h-12 w-72 animate-pulse rounded-md bg-muted md:mt-0" />
        </div>

        {/* Category pills skeleton */}
        <div className="mb-10 mt-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 w-24 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>

        {/* Products grid skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border bg-white">
              <div className="aspect-square animate-pulse bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                <div className="h-5 w-full animate-pulse rounded bg-muted" />
                <div className="h-6 w-28 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
