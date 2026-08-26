export default function BlogLoading() {
  return (
    <main className="min-h-[100dvh] bg-[hsl(0,0%,100%)] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="h-10 w-32 bg-primary-soft rounded-lg animate-pulse mb-8" />
        
        {/* Category pills */}
        <div className="flex flex-wrap gap-2.5 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-primary-soft rounded-full animate-pulse" />
          ))}
        </div>

        {/* Blog grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl bg-white border border-[#e3ebdd] overflow-hidden">
              <div className="aspect-video bg-primary-soft animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-5 w-20 bg-primary-soft rounded animate-pulse" />
                <div className="h-6 w-full bg-primary-soft rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-primary-soft rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
