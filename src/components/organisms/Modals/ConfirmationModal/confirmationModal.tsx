import { Button } from '@/components/atoms/Button/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { ConfirmationModalProps } from './types'

export function ConfirmationModal({
  isOpen,
  setIsOpen,
  title,
  description,
  content,
  icon,
  action,
  actionLabel,
  actionButtonVariant = 'success',
  cancelLabel = 'Cancelar',
  loading,
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader className="items-center text-center text-[#792EBD]">
          {icon && (
            <div className="mb-2 rounded-full bg-gray-100 p-2 text-gray-600">
              {icon}
            </div>
          )}
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {content && (
          <div className="py-4 text-center text-sm text-gray-600">
            {content}
          </div>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={() => setIsOpen(false)}
            variant="secondary-gray"
            className="text-[#792EBD]"
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            className="bg-[#792EBD] text-white hover:bg-[#792EBD]/90"
            onClick={action}
            variant={actionButtonVariant}
            loading={loading}
            disabled={loading}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
