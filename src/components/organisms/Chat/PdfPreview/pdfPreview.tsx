import { Close, PictureAsPdf } from '@mui/icons-material'

interface PdfPreviewProps {
  fileName: string
  fileSize: number
  onRemove: () => void
}

export function PdfPreview({ fileName, fileSize, onRemove }: PdfPreviewProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-red-100">
        <PictureAsPdf className="h-6 w-6 text-red-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{fileName}</p>
        <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
        aria-label="Remover arquivo"
      >
        <Close className="h-5 w-5" />
      </button>
    </div>
  )
}

