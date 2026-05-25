export default function ExploreLoading() {
  return (
    <main className="min-h-screen bg-[hsl(0,0%,100%)] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero skeleton */}
        <div className="rounded-2xl bg-gradient-to-br from-[#e3ebdd] to-[#c8d5be] p-8 mb-12 animate-pulse">
          <div className="h-8 w-64 bg-white/30 rounded-lg mb-4" />
          <div className="h-6 w-96 bg-white/20 rounded-lg" />
        </div>

        {/* Section skeletons */}
        {[1, 2, 3].map((section) => (
          <div key={section} className="mb-12">
            <div className="h-8 w-48 bg-[#f0f4ec] rounded-lg animate-pulse mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl bg-white border border-[#e3ebdd] overflow-hidden">
                  <div className="aspect-square bg-[#f0f4ec] animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-20 bg-[#f0f4ec] rounded animate-pulse" />
                    <div className="h-5 w-full bg-[#f0f4ec] rounded animate-pulse" />
                    <div className="h-6 w-28 bg-[#f0f4ec] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
