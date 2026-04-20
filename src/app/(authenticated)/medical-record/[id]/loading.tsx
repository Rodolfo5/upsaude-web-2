export default function MedicalRecordLoading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-7 w-52 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  )
}
