'use client'

import VisibilityIcon from '@mui/icons-material/Visibility'
import { Download } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/atoms/Button/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { OrientationEntity } from '@/types/entities/healthPillar'

interface OrientationDetailsModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  orientation: OrientationEntity | null
  goalName?: string
}

const formatDate = (date: Date | string) => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return '-'
  }
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

const isImageFile = (url: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  return imageExtensions.some((ext) => url.toLowerCase().includes(ext))
}

export function OrientationDetailsModal({
  isOpen,
  setIsOpen,
  orientation,
  goalName,
}: OrientationDetailsModalProps) {
  if (!orientation) return null

  const handleDownload = () => {
    if (orientation.supportMaterial) {
      window.open(orientation.supportMaterial, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white sm:max-w-2xl">
        <DialogTitle className="text-xl font-semibold text-[#530570]">
          {orientation.title}
        </DialogTitle>

        <div className="space-y-4">
          {goalName && (
            <div className="rounded-md bg-purple-50 px-3 py-2">
              <p className="text-sm text-[#530570]">
                <span className="font-medium">Meta associada:</span> {goalName}
              </p>
            </div>
          )}

          {orientation.description && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                Descrição
              </h4>
              <p className="whitespace-pre-wrap text-sm text-gray-600">
                {orientation.description}
              </p>
            </div>
          )}

          {orientation.supportMaterial && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                Material de Apoio
              </h4>

              {isImageFile(orientation.supportMaterial) ? (
                <div className="relative max-h-[400px] max-w-[400px] overflow-hidden rounded-lg border border-gray-200">
                  <Image
                    src={orientation.supportMaterial}
                    alt="Material de apoio"
                    className="object-fit h-auto w-full"
                    width={400}
                    height={400}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <VisibilityIcon className="text-[#530570]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getFileName(orientation.supportMaterial)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Clique para visualizar
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-[#530570] hover:bg-purple-50"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">
              Criado por{' '}
              {formatDate(orientation.createdAt)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary-gray"
            onClick={() => setIsOpen(false)}
            className="hover:no-underline"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
