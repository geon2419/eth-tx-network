export function EChartsPageSkeleton() {
  return (
    <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Sidebar Skeleton */}
      <aside className="flex flex-col gap-6">
        {/* Data Source Controls Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>

        {/* Controls Panel Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-4 h-5 w-20 animate-pulse rounded bg-gray-200" />
          <div className="space-y-4">
            {/* Metric button grid skeleton */}
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-11 w-full animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
            {/* TOP N slider skeleton */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-2 w-full animate-pulse rounded-full bg-gray-200" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-6 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
            {/* Binary Toggle skeleton */}
            <div>
              <div className="mb-2 h-4 w-48 animate-pulse rounded bg-gray-200" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Block Window Controls Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-full animate-pulse rounded-full bg-gray-100"
                />
              ))}
            </div>
            <div className="h-2 w-full animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>

        {/* Summary Panel Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 h-5 w-28 animate-pulse rounded bg-gray-200" />
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Charts Skeleton */}
      <div className="flex flex-col gap-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-gray-200 bg-white p-6"
          >
            <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-100 w-full animate-pulse rounded-xl bg-gray-50" />
          </div>
        ))}
      </div>
    </section>
  );
}
