'use client'

import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/atoms/Button/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

import { MedicationSuccessModalProps } from './types'

export function MedicationSuccessModal({
  isOpen,
  onClose,
  onBack,
}: MedicationSuccessModalProps) {
  const handleBack = () => {
    onClose()
    onBack()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">
        Medicação suspendida com sucesso
      </DialogTitle>
      <DialogContent className="max-w-2xl border-none bg-white p-12 shadow-xl">
        <div className="flex flex-col items-center bg-white text-center">
          <h1 className="mb-4 text-4xl font-semibold text-gray-900">
            Medicação suspendida
            <br />
            com sucesso!
          </h1>

          <div className="mb-10 mt-8">
            <Image
              src="/ilustra-sucesso-paciente.png"
              alt="Sucesso"
              width={200}
              height={200}
              className="h-48 w-48"
            />
          </div>

          <Button
            onClick={handleBack}
            variant="ghost"
            className="flex items-center gap-2 text-lg text-purple-600 hover:bg-transparent hover:text-purple-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
