export default function ProductsLoading() {
  return (
    <main className="min-h-[100dvh] bg-[hsl(0,0%,100%)] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Title skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="h-10 w-48 bg-[#f0f4ec] rounded-lg animate-pulse" />
          <div className="h-10 w-72 bg-[#f0f4ec] rounded-full animate-pulse mt-4 md:mt-0" />
        </div>

        {/* Category pills skeleton */}
        <div className="mb-10 mt-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-4 w-20 bg-[#f0f4ec] rounded animate-pulse" />
            <div className="flex-1 h-px bg-[#d4dec9]" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-[#f0f4ec] rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* Products grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-2xl bg-[#eef3ea] border border-[#d2dec9] overflow-hidden">
              <div className="aspect-square bg-white animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-20 bg-[#f0f4ec] rounded animate-pulse" />
                <div className="h-5 w-full bg-[#f0f4ec] rounded animate-pulse" />
                <div className="h-6 w-28 bg-[#f0f4ec] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
