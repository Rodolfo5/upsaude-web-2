'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { FileText as ArticleOutlinedIcon } from 'lucide-react'
import { Pencil as EditOutlinedIcon } from 'lucide-react'
import { History as HistoryOutlinedIcon } from 'lucide-react'
import { Info as InfoOutlinedIcon } from 'lucide-react'
import { PanelLeft as ViewSidebarOutlinedIcon } from 'lucide-react'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import Textarea from '@/components/atoms/Textarea/textarea'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import { DischargePlanModal } from '@/components/organisms/Modals/DischargePlanModal/dischargePlanModal'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHealthCheckups } from '@/hooks/queries/useHealthCheckups'
import {
  useCreateTherapeuticPlan,
  useHasDischargedPlan,
  useTherapeuticPlan,
  useUpdateTherapeuticPlan,
} from '@/hooks/queries/useTherapeuticPlan'
import { useCreateTimelinePatient } from '@/hooks/queries/useTimelinePatients'
import useDoctor from '@/hooks/useDoctor'
import { usePatient } from '@/hooks/usePatient'
import useUser from '@/hooks/useUser'
import { sendNotification } from '@/services/notification/notification'
import { NotificationEntity } from '@/types/entities/notification'
import { isCheckupCompleted } from '@/utils/checkup/checkupStatus'
import therapeuticPlanSchema, {
  TherapeuticPlanFormData,
} from '@/validations/therapeuticPlan'

import { ConsultationPlan } from './components/ConsultationPlan/ConsultationPlan'
import { DiagnosticsTable } from './components/DiagnosticsTable/diagnosticsTable'
import { HealthPillars } from './components/HealthPillars/healthPillars'
import { MedicationsTab } from './components/MedicationsTab/medicationsTab'

interface Props {
  params: Promise<{
    id: string
    planId: string
  }>
}

export default function TherapeuticPlanPage({ params }: Props) {
  const { id: patientId, planId } = use(params)
  const router = useRouter()
  const { currentUser } = useUser()
  const { currentDoctor } = useDoctor()
  const { patient } = usePatient(patientId)
  const isNewPlan = planId === 'new'

  const { data: existingPlan, isLoading: isLoadingPlan } = useTherapeuticPlan(
    patientId,
    planId,
  )

  const { mutateAsync: createPlan, isPending: isCreating } =
    useCreateTherapeuticPlan()
  const { mutateAsync: updatePlan, isPending: isUpdating } =
    useUpdateTherapeuticPlan()
  const { data: checkups = [] } = useHealthCheckups(patientId)
  const createTimelineMutation = useCreateTimelinePatient()

  const [activeTab, setActiveTab] = useState('definicoes')
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false)
  const [isAiWarningModalOpen, setIsAiWarningModalOpen] = useState(false)

  // Selecionar último check-up completo do paciente
  const latestCompletedCheckup = checkups
    .filter((checkup) =>
      isCheckupCompleted(checkup as unknown as Record<string, unknown>),
    )
    .sort((a, b) => {
      const dateA = a.completedAt || a.createdAt
      const dateB = b.completedAt || b.createdAt
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })[0]

  // Schema customizado que aceita string e converte para number
  const formSchema = therapeuticPlanSchema.extend({
    reevaluationPeriod: z.preprocess(
      (val) => {
        if (typeof val === 'string') return Number(val)
        return val
      },
      z
        .number()
        .min(1, 'O período deve ser maior que 0')
        .max(999, 'O período não pode ser maior que 999'),
    ),
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objective: '',
      reevaluationPeriod: 6,
      reevaluationPeriodUnit: 'Meses',
    },
  })

  // Preencher formulário quando plano existente carregar
  useEffect(() => {
    if (existingPlan && !isNewPlan) {
      reset({
        objective: existingPlan.objective,
        reevaluationPeriod: existingPlan.reevaluationPeriod,
        reevaluationPeriodUnit: existingPlan.reevaluationPeriodUnit,
      })
    }
  }, [existingPlan, isNewPlan, reset])

  const onSaveDraft = async (data: TherapeuticPlanFormData) => {
    setIsSaving(true)
    try {
      if (isNewPlan) {
        const newPlan = await createPlan({
          patientId,
          data: {
            ...data,
            doctorId: currentUser?.id || '',
            status: 'draft',
          },
        })
        // Redireciona para o plano criado
        router.push(`/pacientes/${patientId}/plano-terapeutico/${newPlan.id}`)
      } else {
        await updatePlan({
          patientId,
          planId,
          data: {
            ...data,
            status: 'draft',
          },
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const onMakeAvailable = async (data: TherapeuticPlanFormData) => {
    // Verificar se há itens criados com IA pendentes
    const hasPendingAiItems =
      existingPlan?.aiGeneratedItems?.pending &&
      existingPlan.aiGeneratedItems.pending > 0

    if (hasPendingAiItems) {
      setIsAiWarningModalOpen(true)
      return
    }

    setIsSaving(true)
    try {
      if (isNewPlan) {
        const newPlan = await createPlan({
          patientId,
          data: {
            ...data,
            doctorId: currentUser?.id || '',
            status: 'available',
          },
        })

        try {
          const doctorName =
            currentDoctor?.name || currentUser?.name || 'Médico'
          await createTimelineMutation.mutateAsync({
            userId: patientId,
            data: {
              title: `Dr(a). ${doctorName} disponibilizou um plano terapêutico`,
              createdBy: 'Doctor',
              type: 'Plano Terapêutico',
            },
          })
        } catch (error) {
          // Log do erro mas não impede o sucesso da operação
          console.error('Erro ao criar timeline:', error)
        }

        const notificationData: Omit<NotificationEntity, 'id' | 'createdAt'> = {
          title: `Plano terapêutico disponibilizado`,
          content: `Dr(a). ${currentDoctor?.name || currentUser?.name || 'Médico'} disponibilizou um plano terapêutico para você.`,
          type: 'Plano Terapêutico',
          users: [{ userId: patientId, tokens: patient?.tokens ?? [] }],
          status: '',
          date: null,
          hasSeenToUsers: [],
        }

        await sendNotification(notificationData)

        // Redireciona para o plano criado
        router.push(`/pacientes/${patientId}/plano-terapeutico/${newPlan.id}`)
      } else {
        await updatePlan({
          patientId,
          planId,
          data: {
            ...data,
            status: 'available',
          },
        })

        const notificationData: Omit<NotificationEntity, 'id' | 'createdAt'> = {
          title: `Plano terapêutico disponibilizado`,
          content: `Dr(a). ${currentDoctor?.name || currentUser?.name || 'Médico'} disponibilizou um plano terapêutico para você.`,
          type: 'Plano Terapêutico',
          users: [{ userId: patientId, tokens: patient?.tokens ?? [] }],
          status: '',
          date: null,
          hasSeenToUsers: [],
        }

        await sendNotification(notificationData)
      }

      // Criar timeline quando o plano for disponibilizado
      try {
        const doctorName = currentDoctor?.name || currentUser?.name || 'Médico'
        await createTimelineMutation.mutateAsync({
          userId: patientId,
          data: {
            title: `Dr(a). ${doctorName} disponibilizou um plano terapêutico`,
            createdBy: 'Doctor',
            type: 'Plano Terapêutico',
          },
        })
      } catch (error) {
        // Log do erro mas não impede o sucesso da operação
        console.error('Erro ao criar timeline:', error)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleGeneratePlan = async () => {
    if (!latestCompletedCheckup || !currentUser) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkupId: latestCompletedCheckup.id,
          patientId,
          doctorId: currentUser.uid,
          doctorName: currentUser.name || currentUser.email || 'Sistema',
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar plano terapêutico')
      }

      // Redirecionar para o plano criado
      if (data.planId) {
        router.push(`/pacientes/${patientId}/plano-terapeutico/${data.planId}`)
      }
    } catch (err) {
      console.error('Erro ao gerar plano:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao gerar plano terapêutico. Tente novamente.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const periodOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }))

  const periodUnitOptions = [
    { value: 'Dias', label: 'Dias' },
    { value: 'Semanas', label: 'Semanas' },
    { value: 'Meses', label: 'Meses' },
  ]

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const calculateReevaluationDate = (
    createdAt: Date | string,
    period: number,
    unit: string,
  ): Date => {
    const created =
      typeof createdAt === 'string' ? new Date(createdAt) : createdAt
    const reevaluation = new Date(created)

    if (unit === 'Meses') {
      reevaluation.setMonth(reevaluation.getMonth() + period)
    } else if (unit === 'Semanas') {
      reevaluation.setDate(reevaluation.getDate() + period * 7)
    } else if (unit === 'Dias') {
      reevaluation.setDate(reevaluation.getDate() + period)
    }

    return reevaluation
  }

  const isPlanAvailable = existingPlan?.status === 'available'
  const isPlanDischarged = !!existingPlan?.dischargedAt
  const hasDischargedPlan = useHasDischargedPlan(patientId)
  const isDischargeDisabled = isPlanDischarged || hasDischargedPlan
  const isPatientDoctor = currentDoctor?.id === patient?.doctorId
  const hasPendingAiItems = Boolean(
    existingPlan?.aiGeneratedItems?.pending &&
    existingPlan.aiGeneratedItems.pending > 0,
  )

  if (isLoadingPlan && !isNewPlan) {
    return (
      <div className="mt-12 flex items-center justify-center px-4 md:px-8 lg:px-20">
        <p className="text-gray-500">Carregando plano terapêutico...</p>
      </div>
    )
  }

  return (
    <div className="relative mt-8 px-4 pb-20 md:px-8 lg:px-20">
      {/* Botão Prontuário - Container Direito Fixo */}
      <div className="fixed right-0 top-16 z-50 -translate-y-1/2 border-l border-gray-200 pl-2">
        <div className="relative flex items-center">
          <Button
            variant="outline"
            className="mr-2 flex h-12 w-12 items-center justify-center rounded-xl border-0 p-0 text-purple-700 hover:bg-purple-200"
            onClick={() =>
              router.push(
                `/medical-record/${patientId}?returnTo=/pacientes/${patientId}/plano-terapeutico/${planId}`,
              )
            }
            title="Ver prontuário"
          >
            <ViewSidebarOutlinedIcon
              fontSize="medium"
              className="text-purple-700"
            />
          </Button>
          <div className="h-20 w-1 bg-gray-200"></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 mr-16 flex justify-between gap-4">
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            className="flex w-fit cursor-pointer items-center gap-2 text-purple-800 hover:text-purple-600"
            onClick={() => router.push(`/pacientes/${patientId}`)}
          >
            <ArrowBackOutlinedIcon fontSize="medium" />
            <span className="text-xl font-semibold">Plano Terapêutico</span>
          </Button>
          <Badge
            variant="outline"
            className="border-purple-600 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-800"
          >
            ID {isNewPlan ? 'Novo' : planId.substring(0, 8)}
          </Badge>
        </div>

        <div className="flex flex-col items-end gap-1 text-[#792EBD]">
          <div>
            <span className="font-medium">Paciente | </span>
            {patient?.name || 'Carregando...'}
          </div>

          {!isNewPlan && existingPlan && (
            <>
              <div className="text-sm text-gray-600">
                Criado em {formatDate(existingPlan.createdAt)} por{' '}
                {existingPlan.createdBy}
              </div>
              {isPlanAvailable && existingPlan.updatedAt && (
                <div className="text-sm text-gray-600">
                  Atualizado em {formatDate(existingPlan.updatedAt)} por{' '}
                  {existingPlan.createdBy}
                </div>
              )}
              {isPlanDischarged && existingPlan.dischargedAt && (
                <div className="text-sm font-medium text-green-600">
                  Alta realizada em {formatDate(existingPlan.dischargedAt)}
                </div>
              )}
              {isPlanAvailable && !isPlanDischarged && (
                <div className="text-sm text-gray-600">
                  Reavaliação prevista em{' '}
                  {formatDate(
                    calculateReevaluationDate(
                      existingPlan.createdAt,
                      existingPlan.reevaluationPeriod,
                      existingPlan.reevaluationPeriodUnit,
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <p className="mb-6 text-sm text-gray-600">
        Defina metas, exercícios e orientações personalizadas para o paciente
      </p>

      {isPlanAvailable && (
        <div className="mb-6 flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            className="border-purple-600 text-purple-600"
            onClick={() =>
              router.push(
                `/pacientes/${patientId}/plano-terapeutico/${planId}/resumo-textual`,
              )
            }
            icon={<ArticleOutlinedIcon />}
          >
            Ver resumo textual
          </Button>
          <Button
            variant="outline"
            className="border-purple-600 text-purple-600"
            onClick={() => {
              // Permitir edição - habilitar formulário
              setActiveTab('definicoes')
            }}
            icon={<EditOutlinedIcon />}
          >
            Ajustar
          </Button>
          <Button
            variant="outline"
            className="border-purple-600 text-purple-600"
            onClick={() =>
              router.push(`/pacientes/${patientId}/planos-terapeuticos`)
            }
            icon={<HistoryOutlinedIcon />}
          >
            Ver histórico de versões
          </Button>
          <Button
            className="bg-purple-600 text-white hover:bg-purple-700"
            onClick={() =>
              isPatientDoctor && !isDischargeDisabled
                ? setIsDischargeModalOpen(true)
                : undefined
            }
            disabled={!isPatientDoctor || isDischargeDisabled}
            title={
              hasDischargedPlan
                ? 'Alta já realizada'
                : isPlanDischarged
                  ? 'Plano já foi dado alta'
                  : !isPatientDoctor
                    ? 'Apenas o médico do paciente pode dar alta'
                    : 'Dar alta ao paciente'
            }
          >
            {isDischargeDisabled ? 'Alta realizada' : 'Dar alta'}
          </Button>
        </div>
      )}

      {!isPlanAvailable && latestCompletedCheckup && (
        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="success"
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating
                ? 'Gerando Plano com IA...'
                : 'Gerar Plano Terapêutico com IA'}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="max-w-md text-center text-xs text-gray-500">
              A IA analisará as respostas do checkup e criará um plano inicial
              com metas, atividades e orientações personalizadas.
            </p>
          </div>
        </div>
      )}

      {hasPendingAiItems && (
        <div className="mb-6 flex w-fit items-center gap-3 rounded-full border-2 border-[#EB34EF] bg-purple-50 px-4 py-3">
          <Sparkles className="h-5 w-5 flex-shrink-0 text-[#EB34EF]" />
          <span className="text-sm font-medium text-[#EB34EF]">
            {existingPlan?.aiGeneratedItems?.pending} itens criados por IA
            pendentes de aprovação
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 flex w-full justify-start gap-2 rounded-none border-b border-gray-200 bg-transparent p-0">
          <TabsTrigger
            value="definicoes"
            className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-600 data-[state=active]:shadow-none"
          >
            Definições Iniciais
          </TabsTrigger>
          <TabsTrigger
            value="diagnosticos"
            className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-600 data-[state=active]:shadow-none"
          >
            Diagnósticos
          </TabsTrigger>
          <TabsTrigger
            value="pilares"
            className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-600 data-[state=active]:shadow-none"
          >
            Pilares de Saúde
          </TabsTrigger>
          <TabsTrigger
            value="consulta"
            className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-600 data-[state=active]:shadow-none"
          >
            Plano de Consulta
          </TabsTrigger>
          <TabsTrigger
            value="medicamentos"
            className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-600 data-[state=active]:shadow-none"
          >
            Medicamentos
          </TabsTrigger>
        </TabsList>

        {/* Definições Iniciais Tab (com formulário funcional) */}
        <TabsContent value="definicoes" className="mt-6">
          <form onSubmit={handleSubmit(onSaveDraft)} className="space-y-6">
            {/* Objetivo do plano */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Objetivo do plano*
              </label>
              <Controller
                name="objective"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Cuidados com a diabetes mellitus"
                    className="min-h-[100px] w-full border-gray-300 text-black focus-visible:border-purple-500 focus-visible:ring-purple-200"
                    variant={errors.objective ? 'error' : 'default'}
                  />
                )}
              />
              {errors.objective && (
                <p className="text-sm text-red-600">
                  {errors.objective.message}
                </p>
              )}
            </div>

            {/* Período para reavaliação */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Período para reavaliação do Plano*
              </label>

              <div className="flex gap-4">
                <div className="w-32">
                  <SelectField
                    name="reevaluationPeriod"
                    control={control}
                    options={periodOptions}
                    placeholder="6"
                    className="border-gray-300"
                  />
                </div>
                <div className="flex">
                  <SelectField
                    name="reevaluationPeriodUnit"
                    control={control}
                    options={periodUnitOptions}
                    placeholder="Meses"
                    className="border-gray-300"
                  />
                </div>
              </div>
              {(errors.reevaluationPeriod || errors.reevaluationPeriodUnit) && (
                <p className="text-sm text-red-600">
                  {errors.reevaluationPeriod?.message ||
                    errors.reevaluationPeriodUnit?.message}
                </p>
              )}

              {/* Informação sobre reavaliação */}
              <div className="flex items-center gap-2 pt-1">
                <InfoOutlinedIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                <span className="text-xs text-gray-600">
                  A reavaliação é a partir do Check-Up digital
                </span>
              </div>
            </div>

            {/* Botão Salvar dentro do conteúdo */}
            <div className="pt-2">
              <Button
                type="submit"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isSaving || isCreating || isUpdating}
                loading={isSaving || isCreating || isUpdating}
              >
                Salvar
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Diagnósticos Tab */}
        <TabsContent value="diagnosticos" className="mt-6">
          <DiagnosticsTable patientId={patientId} planId={planId} />
        </TabsContent>

        {/* Pilares de Saúde Tab */}
        <TabsContent value="pilares" className="mt-6">
          <HealthPillars patientId={patientId} planId={planId} />
        </TabsContent>

        {/* Plano de Consulta Tab (vazia por enquanto) */}
        <TabsContent value="consulta" className="mt-6">
          <ConsultationPlan
            patientId={patientId}
            planId={planId}
            doctorId={currentUser?.id}
          />
        </TabsContent>

        {/* Medicamentos Tab */}
        <TabsContent value="medicamentos" className="mt-6">
          <MedicationsTab patientId={patientId} planId={planId} />
        </TabsContent>
      </Tabs>

      {/* Footer fixo */}
      {!isPlanAvailable && (
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white px-4 py-4 md:px-8 lg:px-20">
          <div className="flex items-center justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleSubmit(onSaveDraft)}
              disabled={isSaving || isCreating || isUpdating}
              loading={isSaving || isCreating || isUpdating}
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              Salvar rascunho
            </Button>
            <Button
              onClick={handleSubmit(onMakeAvailable)}
              disabled={
                isSaving || isCreating || isUpdating || hasPendingAiItems
              }
              loading={isSaving || isCreating || isUpdating}
              className="bg-purple-600 hover:bg-purple-700"
              title={
                hasPendingAiItems
                  ? 'Você precisa revisar e aprovar todos os itens criados com IA antes de disponibilizar o plano'
                  : 'Disponibilizar plano para o paciente'
              }
            >
              Disponibilizar plano
            </Button>
          </div>
        </div>
      )}

      {/* Modal de dar alta */}
      {currentDoctor && (
        <DischargePlanModal
          isOpen={isDischargeModalOpen}
          setIsOpen={setIsDischargeModalOpen}
          patientId={patientId}
          planId={planId}
          doctorId={currentDoctor.id}
          onSuccess={() => {
            // Recarregar a página para atualizar os dados
            router.refresh()
          }}
        />
      )}

      {/* Modal de aviso sobre itens criados com IA */}
      <Dialog
        open={isAiWarningModalOpen}
        onOpenChange={setIsAiWarningModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-800">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Itens Criados com IA Pendentes
            </DialogTitle>
            <DialogDescription className="pt-4 text-left text-gray-700">
              Este plano possui{' '}
              <span className="font-semibold text-purple-600">
                {existingPlan?.aiGeneratedItems?.pending} itens criados por IA
              </span>{' '}
              que ainda não foram revisados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Para disponibilizar o plano terapêutico ao paciente, é necessário
              que você:
            </p>
            <ul className="ml-4 list-disc space-y-2 text-sm text-gray-700">
              <li>Revise todos os itens criados com IA nas diferentes abas</li>
              <li>
                Aprove, edite ou remova cada item conforme sua avaliação clínica
              </li>
              <li>
                Certifique-se de que todas as recomendações estão adequadas para
                o paciente
              </li>
            </ul>
            <div className="rounded-lg bg-purple-50 p-3">
              <p className="text-sm font-medium text-purple-800">
                💡 Os itens com IA estão identificados com o ícone{' '}
                <Sparkles className="inline h-4 w-4" /> nas tabelas.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsAiWarningModalOpen(false)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Entendi, vou revisar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
