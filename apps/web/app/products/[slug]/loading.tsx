export default function ProductLoading() {
  return (
    <main className="min-h-[100dvh] bg-background animate-pulse">
      {/* Back link skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="h-5 w-32 bg-muted rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image skeleton */}
          <div>
            <div className="aspect-square bg-muted rounded-2xl mb-4" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-20 h-20 bg-muted rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="space-y-4">
            <div className="h-5 w-20 bg-muted rounded-full" />
            <div className="h-10 w-3/4 bg-muted rounded-xl" />
            <div className="h-9 w-36 bg-muted rounded-xl" />

            <div className="space-y-2 pt-2">
              <div className="h-5 w-24 bg-muted rounded-full" />
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-9 w-20 bg-muted rounded-full" />
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="h-5 w-20 bg-muted rounded-full" />
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-md" />
                <div className="h-6 w-8 bg-muted rounded" />
                <div className="h-10 w-10 bg-muted rounded-md" />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <div className="h-12 flex-1 bg-muted rounded-full" />
              <div className="h-12 flex-1 bg-muted rounded-full" />
            </div>

            <div className="h-14 bg-muted rounded-xl" />
            <div className="h-28 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
