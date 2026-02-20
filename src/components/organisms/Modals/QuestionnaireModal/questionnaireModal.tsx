'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateRequestQuestionnaire } from '@/hooks/queries/useCreateRequestQuestionnaire'
import { useCombinedPatientsByDoctor } from '@/hooks/queries/usePatientsByDoctor'
import useDoctor from '@/hooks/useDoctor'
import { sendNotification } from '@/services/notification/notification'
import { NotificationEntity } from '@/types/entities/notification'
import { getQuestionnaireType } from '@/utils/questionnaire/getQuestionnairePdfPath'

import { QuestionnaireModalProps } from './types'

const questionnaireSchema = z.object({
  patients: z
    .array(z.string())
    .min(1, 'É necessário selecionar pelo menos um paciente'),
  text: z.string().optional(),
})

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>

export default function QuestionnaireModal({
  isOpen,
  setIsOpen,
  questionnaireName,
}: QuestionnaireModalProps) {
  const { currentDoctor } = useDoctor()
  const { data: patients = [], isLoading } = useCombinedPatientsByDoctor()
  const createRequestMutation = useCreateRequestQuestionnaire()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      patients: [],
      text: '',
    },
    mode: 'onChange',
  })

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  const onSubmit = async (data: QuestionnaireFormData) => {
    if (!currentDoctor?.id) {
      return
    }

    const questionnaireType = getQuestionnaireType(questionnaireName)

    if (!questionnaireType) {
      return
    }

    await createRequestMutation.mutateAsync({
      doctorId: currentDoctor.id,
      patientIds: data.patients,
      questionnaireName,
      text: data.text || undefined,
      type: questionnaireType,
    })

    const notificationData: Omit<NotificationEntity, 'id' | 'createdAt'> = {
      title: `Questionário aplicado: ${questionnaireName}`,
      content: `Dr(a). ${currentDoctor.name} aplicou o questionário ${questionnaireName} para você.`,
      type: 'Questionários de Saúde',
      users: data.patients.map((patientId) => ({
        userId: patientId,
        tokens:
          patients.find((patient) => patient.id === patientId)?.tokens ?? [],
      })),
      status: '',
      date: null,
      hasSeenToUsers: [],
    }

    await sendNotification(notificationData)

    if (!createRequestMutation.isError) {
      handleClose()
    }
  }

  // Transformar pacientes em opções para o MultiSelect
  const patientOptions =
    patients?.map((patient) => ({
      value: patient.id,
      label: patient.name,
    })) || []

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl bg-white md:max-w-xl">
        <DialogHeader className="items-start text-left">
          <DialogTitle className="text-2xl font-regular text-gray-900">
            Aplicar questionário
          </DialogTitle>
          <DialogDescription className="text-lg text-[#530570]">
            {questionnaireName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Campo de seleção de pacientes */}
            <div className="flex w-full flex-col gap-8">
              <SelectField
                label="Paciente(s)*"
                name="patients"
                control={control}
                options={patientOptions}
                placeholder="Selecione os pacientes"
                disabled={isLoading}
                multiple
              />

              <TextareaField
                label="Texto de recomendação"
                name="text"
                control={control}
                placeholder="Digite uma recomendação (opcional)"
                variant="default"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:self-end">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={createRequestMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              className="flex-1"
              disabled={createRequestMutation.isPending || !isValid}
            >
              {createRequestMutation.isPending ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
