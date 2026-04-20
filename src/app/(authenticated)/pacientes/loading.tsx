export default function PacientesLoading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-100">
        <div className="h-11 w-full animate-pulse bg-gray-100" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-t border-gray-100 px-4 py-3"
          >
            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="ml-auto flex gap-2">
              <div className="h-7 w-20 animate-pulse rounded-full bg-gray-200" />
              <div className="h-7 w-7 animate-pulse rounded-full bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
