export default function ConsultationLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
        <p className="text-sm text-gray-500">Carregando consulta...</p>
      </div>
    </div>
  )
}
