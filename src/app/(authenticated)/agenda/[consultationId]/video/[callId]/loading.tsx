export default function VideoCallLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-purple-400 border-t-purple-100" />
        <p className="text-sm text-purple-200">Entrando na videochamada...</p>
      </div>
    </div>
  )
}
