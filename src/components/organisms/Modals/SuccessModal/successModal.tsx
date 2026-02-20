'use client'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/atoms/Button/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

import { SuccessModalProps } from './types'

export function SuccessModal({
  isOpen,
  onClose,
  title,
  subtitle,
  buttonText,
  onButtonClick,
  illustration,
}: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <DialogContent className="max-w-2xl border-none bg-white p-12 shadow-xl">
        <div className="flex flex-col items-center bg-white text-center">
          <h1 className="mb-4 text-4xl font-semibold text-gray-900">{title}</h1>

          <p className="mb-8 text-lg text-gray-600">{subtitle}</p>

          {illustration && <div className="mb-10">{illustration}</div>}

          <Button
            onClick={onButtonClick}
            variant="ghost"
            className="flex items-center gap-2 text-lg text-purple-600 hover:bg-transparent hover:text-purple-700"
          >
            <ArrowLeft className="h-5 w-5" />
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
