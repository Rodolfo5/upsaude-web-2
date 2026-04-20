import { ArrowUpRight as ArrowOutwardOutlinedIcon } from 'lucide-react'
import { MoreVertical as MoreVertOutlinedIcon } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/atoms/Button/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useHealthCheckups } from '@/hooks/queries/useHealthCheckups'

type Props = {
  onRequestNew?: () => void
  onSetRecurrence?: () => void
  onOpenHistory?: () => void
  onViewDetails?: (id: string) => void
  className?: string
  patientId?: string
  /**
   * Modo somente leitura: esconde ações de criação (menu dropdown)
   * mas ainda permite visualizar histórico e resultados quando há check-ups.
   */
  readOnly?: boolean
  isQRCodePendingDoctor?: boolean
}

function formatDate(value: unknown) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  try {
    return new Intl.DateTimeFormat('pt-BR').format(date)
  } catch {
    return String(value)
  }
}

const HealthCheckupCard: React.FC<Props> = ({
  onRequestNew,
  onSetRecurrence,
  onOpenHistory,
  onViewDetails,
  className = '',
  patientId,
  readOnly = false,
  isQRCodePendingDoctor = false,
}) => {
  const { data: checkups, isLoading } = useHealthCheckups(patientId)

  const completedCheckups = Array.isArray(checkups)
    ? checkups.filter((c) => c.status === 'COMPLETED')
    : []
  const latest = completedCheckups.length > 0 ? completedCheckups[0] : null
  const dateStr = latest
    ? formatDate(latest.completedAt || latest.createdAt)
    : null

  return (
    <Card
      className={`h-fit max-w-[340px] gap-y-2 rounded-3xl border-gray-200 bg-white p-6 shadow-none ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="mt-1 text-xl font-semibold text-primary-700">
          Check-Up digital
        </h3>

        {!isQRCodePendingDoctor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={'ghost'}
                className="cursor-pointer rounded-full p-2 text-primary-700 hover:no-underline"
              >
                <MoreVertOutlinedIcon fontSize="medium" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border border-gray-50 bg-brand-pink-50">
              {!readOnly && (
                <>
                  <DropdownMenuItem
                    onClick={onRequestNew}
                    className="focus:bg-gray-200 focus:text-inherit"
                  >
                    Solicitar novo
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onSetRecurrence}
                    className="focus:bg-gray-200 focus:text-inherit"
                  >
                    Definir recorrência
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onClick={onOpenHistory}
                className="focus:bg-gray-200 focus:text-inherit"
              >
                Acessar histórico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center rounded-lg rounded-l-none border-l-4 border-brand-purple-dark-500 bg-[#F6ECF8] p-3">
        <div className="flex-1">
          <div className="text-base font-medium text-gray-800">
            Último realizado
          </div>
          <div className="mt-2 text-sm text-gray-700">
            {isLoading
              ? 'Carregando...'
              : (dateStr ?? 'Nenhum check-up encontrado')}
          </div>
        </div>

        {latest && !isQRCodePendingDoctor && (
          <Button
            variant={'link'}
            onClick={() => onViewDetails && onViewDetails(latest.id)}
            className="flex w-[40%] items-center text-sm font-medium text-[#6F2AA6] hover:no-underline"
          >
            Ver resultado
            <ArrowOutwardOutlinedIcon fontSize="small" className="ml-1" />
          </Button>
        )}
      </div>
    </Card>
  )
}

export default HealthCheckupCard
