import { Button } from '@/components/atoms/Button/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { UsageClassificationWarningModalProps } from './types'

export function UsageClassificationWarningModal({
  isOpen,
  onClose,
  medicationName,
}: UsageClassificationWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader className="items-center text-center text-[#792EBD]">
          <DialogTitle>Classificação de uso</DialogTitle>
          <DialogDescription className="text-gray-600">
            {medicationName
              ? `O medicamento "${medicationName}" foi salvo como Sintomático por padrão.`
              : 'O medicamento foi salvo como Sintomático por padrão.'}{' '}
            Revise e altere a classificação na tabela de medicamentos, se
            necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center pt-4">
          <Button
            className="bg-[#792EBD] text-white hover:bg-[#792EBD]/90"
            onClick={onClose}
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
