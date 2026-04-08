import { AttachFile, Send } from '@mui/icons-material'
import { useRef } from 'react'

import { PdfPreview } from '../PdfPreview/pdfPreview'

import { MessageInputProps } from './types'

export function MessageInput({
  messageText,
  isSending,
  selectedFile,
  onMessageChange,
  onFileSelect,
  onFileRemove,
  onSend,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (selectedFile || messageText.trim()) {
        onSend()
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que é PDF
      if (
        file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')
      ) {
        alert('Apenas arquivos PDF são permitidos')
        return
      }

      // Validar tamanho (máximo 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert('Arquivo muito grande. Máximo 10MB')
        return
      }

      onFileSelect(file)
    }

    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const canSend = selectedFile || messageText.trim()

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4">
      {selectedFile && (
        <PdfPreview
          fileName={selectedFile.fileName}
          fileSize={selectedFile.fileSize}
          onRemove={onFileRemove}
        />
      )}
      <div className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 sm:px-4 sm:py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Selecionar PDF"
        />
        <button
          type="button"
          onClick={handleAttachClick}
          className="shrink-0 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Anexar arquivo PDF"
          disabled={isSending}
        >
          <AttachFile className="h-5 w-5" />
        </button>
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="min-w-0 flex-1 bg-transparent text-sm !text-gray-900 outline-none placeholder:text-gray-400"
          style={{ color: '#111827' }}
          disabled={isSending || !!selectedFile}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={isSending || !canSend}
          className="shrink-0 rounded-full bg-purple-600 p-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          aria-label="Enviar mensagem"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
