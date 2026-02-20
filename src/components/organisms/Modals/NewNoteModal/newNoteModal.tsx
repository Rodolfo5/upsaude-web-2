import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateTimelinePatient } from '@/hooks/queries/useTimelinePatients'
import { errorToast } from '@/hooks/useAppToast'
import useDoctor from '@/hooks/useDoctor'
import { createNote } from '@/services/notes'

interface Props {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  patientId: string
  onCreated?: () => void
}

export function NewObservationModal({
  isOpen,
  setIsOpen,
  patientId,
  onCreated,
}: Props) {
  const { currentDoctor } = useDoctor()
  const [loading, setLoading] = useState(false)
  const createTimelineMutation = useCreateTimelinePatient()
  const { control, handleSubmit, reset } = useForm<{ content: string }>({
    defaultValues: { content: '' },
  })

  const handleCreate = async (data: { content: string }) => {
    if (!currentDoctor) return errorToast('Médico não encontrado')
    if (!data.content || data.content.trim() === '')
      return errorToast('Observação vazia')

    setLoading(true)
    try {
      await createNote(patientId, {
        doctorId: currentDoctor.id,
        content: data.content,
      })
      await createTimelineMutation.mutateAsync({
        userId: patientId,
        data: {
          title: `Dr(a). ${currentDoctor.name} adicionou uma observação`,
          createdBy: 'Doctor',
          type: 'Observações Médicas',
        },
      })
      setIsOpen(false)
      reset()
      if (onCreated) onCreated()
    } catch (err) {
      console.error(err)
      errorToast('Erro ao salvar observação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(false)}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogTitle className="mb-4 text-xl font-normal text-gray-700">
          Adicionar Observação
        </DialogTitle>
        <form onSubmit={handleSubmit(handleCreate)}>
          <TextareaField
            control={control}
            name="content"
            className="w-full rounded border p-2"
            label="Escreva a observação*"
          />

          <DialogFooter className="mt-2 flex justify-end">
            <Button
              onClick={() => {
                setIsOpen(false)
                reset()
              }}
              variant="link"
              disabled={loading}
              className="hover:no-underline"
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="ml-2">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewObservationModal
