import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import React, { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { Card } from '@/components/ui/card'
import { useNotes } from '@/hooks/queries/useNotes'
import type { NoteEntity } from '@/types/entities/note'

import NewObservationModal from '../Modals/NewNoteModal/newNoteModal'

type Props = {
  className?: string
  patientId?: string
  isAdmin?: boolean
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

export default function NoteCard({
  className = '',
  patientId,
  isAdmin = false,
  isQRCodePendingDoctor = false,
}: Props) {
  const { data: notes = [], isLoading, refetch } = useNotes(patientId)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Card
        className={`flex w-full max-w-xl flex-col rounded-3xl border-gray-200 bg-white p-6 ${className}`}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold text-primary-700">
            Observações
          </h3>

          {!isAdmin && !isQRCodePendingDoctor && (
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-purple-800 hover:text-purple-600"
              onClick={() => {
                setIsOpen(true)
              }}
            >
              <AddOutlinedIcon fontSize="small" />
              Adicionar
            </Button>
          )}
        </div>

        <div className="mt-6 max-h-96 space-y-3 overflow-y-auto">
          {isLoading ? (
            <div>Carregando...</div>
          ) : notes.length === 0 ? (
            <div className="text-sm text-gray-600">
              Nenhuma observação encontrada
            </div>
          ) : (
            (notes as NoteEntity[]).map((n) => (
              <div
                key={n.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-primary-700">
                      {n.doctor?.name || 'Dr.'}
                    </div>
                    {n.doctor ? (
                      <div className="text-xs text-gray-500">
                        {`${n.doctor.typeOfCredential || ''} ${n.doctor.credential || ''} ${n.doctor.state || ''}`.trim()}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(n.createdAt)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-700">{n.content}</div>
              </div>
            ))
          )}
        </div>
      </Card>
      <NewObservationModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        patientId={patientId || ''}
        onCreated={() => refetch()}
      />
    </>
  )
}
