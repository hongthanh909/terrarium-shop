export default function PoliciesLoading() {
  return (
    <div className="min-h-[100dvh] bg-white px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 border-b border-border pb-10">
          <div className="mb-4 h-3 w-36 animate-pulse rounded bg-muted" />
          <div className="h-12 max-w-2xl animate-pulse rounded-md bg-muted sm:h-14" />
          <div className="mt-5 h-5 max-w-xl animate-pulse rounded bg-muted" />
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex min-h-20 items-center gap-4 border-t border-border px-4 first:border-t-0 sm:px-6">
              <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
              <div className="h-5 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
