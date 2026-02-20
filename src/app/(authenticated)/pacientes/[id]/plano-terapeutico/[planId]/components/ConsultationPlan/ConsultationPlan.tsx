'use client'

import { Add } from '@mui/icons-material'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { ComplementaryConsultationModal } from '@/components/organisms/Modals/ComplementaryConsultationModal/complementaryConsultationModal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import useConsultationPlans from '@/hooks/queries/useConsultationPlans'
import useConsultationsByPatient from '@/hooks/queries/useConsultationsByPatient'
import { AgendaConsultation } from '@/types/entities/agendaConsultation'

import { getConsultationPlanColumns } from './columnsConsultations'
import { getPlanColumns } from './columnsPlans'

interface ConsultationPlanProps {
  patientId: string
  planId?: string
  doctorId?: string
}

export function ConsultationPlan({
  patientId,
  planId,
  doctorId,
}: ConsultationPlanProps) {
  const { data: consultations = [] } = useConsultationsByPatient(patientId)
  const { data: plans = [] } = useConsultationPlans(patientId, planId || '')

  const plansWithPerformed = useMemo(() => {
    return plans.map((plan) => {
      const performed = consultations.filter(
        (c) => c.consultationId === plan.id && c.status === 'COMPLETED',
      ).length
      return { ...plan, performed }
    })
  }, [plans, consultations])

  const [activeTab, setActiveTab] = useState<'consultas' | 'planos'>(
    'consultas',
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  const consultationsData: AgendaConsultation[] = useMemo(() => {
    const all = (consultations as AgendaConsultation[]) || []
    const filtered = all.filter((c) => c.status === 'COMPLETED')
    return filtered.map((c) => ({
      ...c,
      patientName: c.patientName || 'Paciente',
    }))
  }, [consultations])

  const columns = useMemo(() => getConsultationPlanColumns(), [])
  const planColumns = useMemo(
    () => getPlanColumns(patientId, planId || ''),
    [patientId, planId],
  )

  return (
    <div className="w-full">
      <Tabs
        defaultValue={activeTab}
        onValueChange={(v) => setActiveTab(v as 'consultas' | 'planos')}
      >
        <TabsList className="gap-1 bg-transparent">
          <TabsTrigger
            value="consultas"
            className="rounded-full bg-[#F3EDF7] p-3 px-4 font-normal text-black data-[state=active]:bg-purple-800 data-[state=active]:text-white"
          >
            Consultas
          </TabsTrigger>
          <TabsTrigger
            value="planos"
            className="rounded-full bg-[#F3EDF7] p-3 px-4 font-normal text-black data-[state=active]:bg-purple-800 data-[state=active]:text-white"
          >
            Planos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultas">
          <DataTable
            columns={columns}
            data={consultationsData}
            searchColumns={['doctorName', 'specialty']}
            mainAction={
              <Button
                className="h-10 rounded-full"
                variant="default"
                onClick={() => setIsModalOpen(true)}
              >
                <Add />
                Adicionar plano de consulta
              </Button>
            }
            searchInputPlaceholder="Pesquisar por médico e especialidade..."
          />
        </TabsContent>

        <TabsContent value="planos">
          <DataTable
            columns={planColumns}
            data={plansWithPerformed}
            searchColumns={['specialty']}
            searchInputPlaceholder="Pesquisar por especialidade..."
            mainAction={
              <Button
                className="h-10 rounded-full"
                variant="default"
                onClick={() => setIsModalOpen(true)}
              >
                <Add />
                Adicionar plano de consulta
              </Button>
            }
          />
        </TabsContent>
      </Tabs>

      <ComplementaryConsultationModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        doctorId={doctorId || ''}
        consultationId={planId}
        patientId={patientId}
        onSuccess={() => {}}
        isPlan={true}
      />
    </div>
  )
}
