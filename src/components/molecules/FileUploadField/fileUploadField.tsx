/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Control, Controller } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import { Label } from '@/components/atoms/Label/label'
import { errorToast, successToast } from '@/hooks/useAppToast'
import { uploadImage, uploadFile } from '@/services/firebase/firebaseStorage'

interface FileUploadFieldProps {
  name: string
  control: Control<any>
  label: string
  accept?: string
  maxSize?: number
  onFileSelect: (file: File | string) => void
  loading?: boolean
  currentFile?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
}

export default function FileUploadField({
  name,
  control,
  label,
  accept = '*/*',
  maxSize = 5,
  onFileSelect,
  loading = false,
  helpText,
  required = false,
  disabled = false,
}: FileUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      errorToast(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`)
      return
    }

    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map((type) => type.trim())
      const fileType = file.type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

      const isAccepted = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          const baseType = type.split('/')[0]
          return fileType.startsWith(baseType + '/')
        }
        return type === fileType || type === fileExtension
      })

      if (!isAccepted) {
        errorToast('Tipo de arquivo não aceito')
        return
      }
    }

    try {
      setIsUploading(true)
      const isImage = file.type.startsWith('image/')
      const folder = isImage ? 'profile-images' : 'documents'

      const { url, error } = isImage
        ? await uploadImage(file, folder)
        : await uploadFile(file, folder)

      if (error) {
        console.error('Erro no upload:', error)
        errorToast(`Erro no upload: ${error}`)
        return
      }

      if (url) {
        onFileSelect(url)
        successToast('Arquivo carregado com sucesso!')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      errorToast('Erro inesperado no upload do arquivo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleRemove = (setValue: (value: string) => void) => {
    setValue('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />
    }

    return <FileText className="h-6 w-6 text-red-500" />
  }

  const getFileName = (url: string) => {
    try {
      const decodedUrl = decodeURIComponent(url)
      const fileName = decodedUrl.split('/').pop() || 'arquivo'
      const cleanFileName = fileName.split('?')[0]
      return cleanFileName.replace(/^(profile|document)_\d+_/, '')
    } catch {
      return 'arquivo'
    }
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div className="space-y-2">
          <Label htmlFor={name}>
            {label}
            {required && <span className="text-red-500"> *</span>}
          </Label>

          {!value ? (
            <div
              className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragActive
                  ? 'border-[#792EBD] bg-[#792EBD]/10'
                  : 'border-[#E5E5E5] hover:border-[#525252]'
              } ${disabled || loading || isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() =>
                !disabled &&
                !loading &&
                !isUploading &&
                fileInputRef.current?.click()
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled || loading || isUploading}
              />

              {loading || isUploading ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#792EBD] border-t-[#792EBD]" />
                    <Upload className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-[#792EBD]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#171717]">
                      Enviando arquivo...
                    </p>
                    <p className="text-xs text-[#525252]">
                      Aguarde enquanto processamos o upload
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-8 w-8 text-[#525252]" />
                  <div>
                    <p className="text-sm font-medium text-[#171717]">
                      Clique para enviar o arquivo
                    </p>
                    {helpText && (
                      <p className="mt-1 text-xs text-[#525252]">{helpText}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center space-x-3">
                  {getFileIcon(getFileName(value))}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium text-[#171717]"
                      title={getFileName(value)}
                    >
                      {getFileName(value)}
                    </p>
                    <p className="text-xs text-[#525252]">Arquivo enviado</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary-gray"
                  size="sm"
                  onClick={() => handleRemove(onChange)}
                  disabled={disabled || loading || isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {error && <FormErrorLabel>{error.message}</FormErrorLabel>}
        </div>
      )}
    />
  )
}
