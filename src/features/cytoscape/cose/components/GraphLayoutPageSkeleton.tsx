export function GraphLayoutPageSkeleton() {
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

        {/* Focus Controls + Binary Toggle Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 h-4 w-20 animate-pulse rounded bg-gray-200" />
          {/* Search Input */}
          <div className="h-11 w-full animate-pulse rounded-lg bg-gray-100" />

          {/* Search and Clear Buttons */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>

          {/* Search Message Area (placeholder) */}
          <div className="mt-3 h-5 w-full animate-pulse rounded bg-gray-100" />

          {/* Top Addresses Section */}
          <div className="mt-4">
            <div className="mb-2 h-4 w-28 animate-pulse rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          </div>

          {/* Binary Toggle Section */}
          <div className="mt-6">
            <div className="mb-2 h-4 w-48 animate-pulse rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Block Window Controls Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 h-4 w-32 animate-pulse rounded bg-gray-200" />

          {/* Presets Buttons */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="h-8 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="h-8 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="h-8 w-full animate-pulse rounded-lg bg-gray-100" />
          </div>

          {/* Slider Area */}
          <div className="space-y-3">
            <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
            <div className="h-2 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        {/* Network Summary Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <div className="mb-2 h-3 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="mb-2 h-3 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        {/* Time Range Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 h-5 w-24 animate-pulse rounded bg-gray-200" />
          <div className="flex flex-col gap-2">
            {/* From */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            {/* To */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            {/* Window size */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            </div>
            {/* Max addresses */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            </div>
            {/* Available blocks */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </aside>

      {/* Graph View Skeleton */}
      <div className="flex min-h-[70vh] flex-col gap-4 rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4">
        {/* View Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2">
          <div className="h-5 w-12 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-gray-100" />
        </div>

        {/* Graph Canvas */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </section>
  );
}
