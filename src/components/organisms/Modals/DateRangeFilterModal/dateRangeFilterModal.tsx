import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { DateRange } from 'react-day-picker'

import { Button } from '@/components/atoms/Button/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface DateRangeFilterModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  currentRange: { from: Date; to: Date } | null
  onApply: (range: { from: Date; to: Date }) => void
  onClear: () => void
}

export function DateRangeFilterModal({
  isOpen,
  setIsOpen,
  currentRange,
  onApply,
  onClear,
}: DateRangeFilterModalProps) {
  const [tempRange, setTempRange] = useState<DateRange | undefined>(
    currentRange ? { from: currentRange.from, to: currentRange.to } : undefined,
  )

  // Keep the temporary range in sync when the modal opens or when currentRange changes
  useEffect(() => {
    setTempRange(
      currentRange
        ? { from: currentRange.from, to: currentRange.to }
        : undefined,
    )
  }, [currentRange, isOpen])

  const handleApply = () => {
    if (tempRange?.from && tempRange?.to) {
      onApply({ from: tempRange.from, to: tempRange.to })
    }
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempRange(undefined)
    onClear()
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempRange(
      currentRange
        ? { from: currentRange.from, to: currentRange.to }
        : undefined,
    )
    setIsOpen(false)
  }

  const clearTempSelection = () => {
    setTempRange(undefined)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary-900">
            Filtrar Período
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {tempRange?.from && tempRange?.to && (
            <div className="mb-4 flex items-center">
              <div className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 p-1 text-sm text-primary-900">
                <CalendarMonthOutlinedIcon fontSize="small" />
                <span className="font-medium">
                  {format(tempRange.from, 'dd/MM/yyyy')} -{' '}
                  {format(tempRange.to, 'dd/MM/yyyy')}
                </span>
                <Button
                  variant={'link'}
                  type="button"
                  aria-label="Limpar seleção"
                  onClick={clearTempSelection}
                  className="text-sm text-primary-900 hover:bg-gray-100"
                >
                  <CloseOutlinedIcon fontSize="small" />
                </Button>
              </div>
            </div>
          )}
          <Calendar
            mode="range"
            selected={tempRange}
            onSelect={setTempRange}
            locale={ptBR}
            className="w-full rounded-md"
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            onClick={handleClear}
            variant="link"
            className="flex-1 text-primary-900"
          >
            Limpar Filtro
          </Button>
          <Button
            onClick={handleCancel}
            variant="secondary-color"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            variant="success"
            className="flex-1"
            disabled={!tempRange?.from || !tempRange?.to}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
