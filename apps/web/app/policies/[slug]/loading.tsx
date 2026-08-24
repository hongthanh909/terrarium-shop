export default function PolicyDetailLoading() {
  return (
    <div className="min-h-[100dvh] bg-white px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 h-11 w-40 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <div className="space-y-4">
            <div className="h-11 w-11 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
          </div>
          <div>
            <div className="border-b border-border pb-10">
              <div className="h-12 w-4/5 animate-pulse rounded-md bg-muted" />
              <div className="mt-4 h-4 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-10 space-y-5">
              <div className="h-5 w-full animate-pulse rounded bg-muted" />
              <div className="h-5 w-full animate-pulse rounded bg-muted" />
              <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
              <div className="mt-8 h-8 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-5 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
