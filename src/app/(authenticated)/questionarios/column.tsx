'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Eye, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import QuestionnaireModal from '@/components/organisms/Modals/QuestionnaireModal/questionnaireModal'

export interface Questionnaire {
  id: string
  name: string
}

export const questionnaires: Questionnaire[] = [
  { id: '1', name: 'PHQ-9 - Saúde mental geral' },
  { id: '2', name: 'Avaliação de ansiedade' },
  { id: '3', name: 'Avaliação de estresse' },
  { id: '4', name: 'Escala transversal saude mental' },
  { id: '5', name: 'Controle da Asma' },
  { id: '6', name: 'Impacto da DPOC' },
  {
    id: '7',
    name: 'Consumo de Álcool',
  },
  { id: '8', name: 'Teste de depedencia a Nicotina' },
  { id: '9', name: 'Risco de diabetes' },
  { id: '10', name: 'Adesão ao tratamento medicamentoso' },
  { id: '11', name: 'Percepção da Doença' },
  { id: '12', name: 'Adesão ao rastreio preventivo' },
  {
    id: '13',
    name: 'Risco Cardiovascular 10 anos',
  },
  { id: '14', name: 'Avaliação Estilo de vida' },
  { id: '15', name: 'Comportamento Sedentário' },
  { id: '16', name: 'Frequência Alimentar' },
  { id: '17', name: 'Avaliação Qualidade do Sono' },
  { id: '18', name: 'Prontidão para Mudança' },
  {
    id: '19',
    name: 'Qualidade de Vida',
  },
  {
    id: '20',
    name: 'Autoeficácia Geral',
  },
]

// Componente separado para as ações que pode usar hooks
function QuestionnaireActions({
  questionnaireId,
  questionnaireName,
}: {
  questionnaireId: string
  questionnaireName: string
}) {
  const router = useRouter()
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] =
    useState(false)

  const handleOpenQuestionnaireModal = () => {
    setIsQuestionnaireModalOpen(true)
  }

  const handleViewQuestionnaire = () => {
    router.push(`/questionarios/${questionnaireId}/view`)
  }

  return (
    <>
      <div className="flex items-center gap-x-4">
        <button
          onClick={handleViewQuestionnaire}
          className="cursor-pointer transition-opacity hover:opacity-70"
          title="Visualizar questionário"
        >
          <Eye className="h-5 w-5 text-[#792EBD]" />
        </button>
        <button
          onClick={handleOpenQuestionnaireModal}
          className="cursor-pointer transition-opacity hover:opacity-70"
          title="Aplicar questionário"
        >
          <Play className="h-5 w-5 text-[#792EBD]" />
        </button>
      </div>
      <QuestionnaireModal
        isOpen={isQuestionnaireModalOpen}
        setIsOpen={setIsQuestionnaireModalOpen}
        questionnaireName={questionnaireName}
      />
    </>
  )
}

export const questionnairesColumns: ColumnDef<Questionnaire>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nome
          <ArrowUpDown className="h-4 w-4" />
        </button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return <span className="font-medium">{name}</span>
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const questionnaireId = row.original.id
      const questionnaireName = row.original.name
      return (
        <QuestionnaireActions
          questionnaireId={questionnaireId}
          questionnaireName={questionnaireName}
        />
      )
    },
  },
]
