import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import InputField from '@/components/molecules/InputField/inputField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useCreateDiagnostic,
  useUpdateDiagnostic,
} from '@/hooks/queries/useDiagnostics'
import useUser from '@/hooks/useUser'
import diagnosticSchema, { DiagnosticFormData } from '@/validations/diagnostic'

import { DiagnosticModalProps } from './types'

const categoryOptions = [
  { value: 'Agudo', label: 'Agudo' },
  { value: 'Crônico', label: 'Crônico' },
  { value: 'Recorrente', label: 'Recorrente' },
  { value: 'Suspeita', label: 'Suspeita' },
]

const statusOptions = [
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Resolvido', label: 'Resolvido' },
  { value: 'Descartado', label: 'Descartado' },
  { value: 'Em remissão', label: 'Em remissão' },
]

export function DiagnosticModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  diagnostic,
  onSuccess,
}: DiagnosticModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createDiagnostic, isPending: isCreating } =
    useCreateDiagnostic()
  const { mutateAsync: updateDiagnostic, isPending: isUpdating } =
    useUpdateDiagnostic()

  const isEditing = !!diagnostic

  const { control, handleSubmit, reset } = useForm<DiagnosticFormData>({
    resolver: zodResolver(diagnosticSchema),
    defaultValues: {
      name: '',
      cid: '',
      category: 'Agudo',
      status: 'Ativo',
    },
  })

  useEffect(() => {
    if (diagnostic && isOpen) {
      reset({
        name: diagnostic.name,
        cid: diagnostic.cid,
        category: diagnostic.category,
        status: diagnostic.status,
      })
    } else if (!isOpen) {
      reset({
        name: '',
        cid: '',
        category: 'Agudo',
        status: 'Ativo',
      })
    }
  }, [diagnostic, isOpen, reset])

  const onSubmit = async (data: DiagnosticFormData) => {
    try {
      if (isEditing && diagnostic) {
        await updateDiagnostic({
          patientId,
          planId,
          diagnosticId: diagnostic.id,
          data: {
            name: data.name,
            cid: data.cid,
            category: data.category,
            status: data.status,
          },
        })
      } else {
        await createDiagnostic({
          patientId,
          planId,
          data: {
            name: data.name,
            cid: data.cid,
            category: data.category,
            status: data.status,
            registeredBy: currentUser?.name || '',
            doctorId: currentUser?.id || '',
          },
        })
      }
      setIsOpen(false)
      reset()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar diagnóstico:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogTitle className="text-xl font-normal text-gray-700">
          {isEditing ? 'Editar diagnóstico' : 'Cadastrar diagnóstico'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            name="name"
            control={control}
            label="Nome"
            placeholder="Gripe"
          />

          <InputField
            name="cid"
            control={control}
            label="CID"
            placeholder="A01"
          />

          <SelectField
            name="category"
            control={control}
            label="Categoria"
            options={categoryOptions}
            placeholder="Selecione a categoria"
            searchable={false}
          />

          <SelectField
            name="status"
            control={control}
            label="Status"
            options={statusOptions}
            placeholder="Selecione o status"
            searchable={false}
          />

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="link"
              disabled={isCreating || isUpdating}
              className="hover:no-underline"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isCreating || isUpdating}
              disabled={isCreating || isUpdating}
            >
              {isEditing ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
