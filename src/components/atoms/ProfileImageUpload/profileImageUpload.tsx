'use client'

import { Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useState, useRef } from 'react'

import { useAppToast } from '@/hooks/useAppToast'
import { cn } from '@/lib/utils'
import { uploadImage } from '@/services/firebase/firebaseStorage'

export interface ProfileImageUploadProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
  disabled?: boolean
  label?: string
}

export function ProfileImageUpload({
  value,
  onChange,
  className,
  disabled = false,
  label,
}: ProfileImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useAppToast()

  const handleFileSelect = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      setIsUploading(true)
      try {
        const { url, error } = await uploadImage(file, 'profile-images')
        if (error) {
          toast.error(error)
          setPreviewUrl(null)
          return
        }

        if (url) {
          onChange?.(url)
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error)
        toast.error('Erro ao fazer upload da imagem')
        setPreviewUrl(null)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  const displayImage = value || previewUrl

  return (
    <div
      className={cn(
        'relative cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-all duration-200',
        {
          'border-pink-500 bg-pink-50': isDragOver,
          'border-purple-500 hover:border-purple-600 hover:bg-gray-50':
            !disabled && !isDragOver && !isUploading,
          'cursor-not-allowed opacity-50': disabled || isUploading,
        },
        className,
      )}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {isUploading ? (
        <div className="space-y-2">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-600">Fazendo upload...</p>
        </div>
      ) : displayImage ? (
        <div className="space-y-2">
          <Image
            src={displayImage}
            alt="Preview"
            width={80}
            height={80}
            className="mx-auto h-20 w-20 rounded-full object-cover"
          />
          <p className="text-sm text-gray-600">Clique para alterar</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Camera className="mx-auto h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">{label || 'Faça o Upload'}</p>
        </div>
      )}
    </div>
  )
}
