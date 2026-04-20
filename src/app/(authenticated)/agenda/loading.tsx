export default function AgendaLoading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  )
}
