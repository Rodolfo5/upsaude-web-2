export default function PatientDetailLoading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-200" />
      </div>
      {/* Profile card */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-100 p-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
      {/* Content cards */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  )
}
