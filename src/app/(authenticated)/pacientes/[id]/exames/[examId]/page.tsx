'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { use } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { Badge } from '@/components/ui/badge'
import { useExam } from '@/hooks/queries/useExams'
import { findDoctorById } from '@/services/doctor'

import { getDoctorName, getDoctorCouncil } from '../columns'

interface PageProps {
  params: Promise<{
    id: string
    examId: string
  }>
}

export default function ExamResultPage({ params }: PageProps) {
  const { id: patientId, examId } = use(params)
  const router = useRouter()
  const { data: exam, isLoading, error } = useExam(patientId, examId)

  // Buscar dados do médico
  const { data: doctor } = useQuery({
    queryKey: ['doctor', exam?.doctorId],
    queryFn: () => findDoctorById(exam!.doctorId),
    enabled: !!exam?.doctorId,
    staleTime: 5 * 60 * 1000,
  })

  const handleBack = () => {
    router.push(`/pacientes/${patientId}/exames`)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando resultado do exame...</p>
        </div>
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold text-gray-900">
            Exame não encontrado
          </h1>
          <p className="mb-4 text-gray-600">
            O exame solicitado não está disponível.
          </p>
          <Button onClick={handleBack} variant="outline">
            Voltar para exames
          </Button>
        </div>
      </div>
    )
  }

  if (!exam.examUrl) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold text-gray-900">
            Resultado não disponível
          </h1>
          <p className="mb-4 text-gray-600">
            O arquivo do resultado deste exame não está disponível.
          </p>
          <Button onClick={handleBack} variant="outline">
            Voltar para exames
          </Button>
        </div>
      </div>
    )
  }

  const statusLabel = exam.status === 'completed' ? 'Realizado' : 'Solicitado'
  const statusColor =
    exam.status === 'completed'
      ? 'text-success-600 bg-green-200 hover:bg-green-200'
      : 'bg-gray-100 text-gray-800 hover:bg-gray-100'

  const doctorName = getDoctorName(
    exam,
    doctor ? new Map([[exam.doctorId, doctor]]) : undefined,
  )
  const doctorCouncil = getDoctorCouncil(
    exam,
    doctor ? new Map([[exam.doctorId, doctor]]) : undefined,
  )

  return (
    <div className="mt-8 flex h-[calc(100vh-0px)] w-full flex-col gap-6">
      <div className="flex-shrink-0 bg-white px-4 py-4 sm:px-6 md:px-10 lg:px-20">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-start gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowBackOutlinedIcon className="h-5 w-5 text-purple-800" />
              </Button>
            </div>
            <h1 className="break-words text-lg font-semibold text-[#530570] sm:text-xl md:text-2xl lg:text-3xl">
              Resultado do exame
            </h1>
          </div>

          <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600">
                Profissional solicitante | {doctorName}
              </div>
              {doctorCouncil && doctorCouncil !== '-' && (
                <div className="text-sm text-gray-600">
                  Credencial | {doctorCouncil}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 text-right">
              <div className="flex items-center gap-2">
                <span className="text-lg text-[#530570]">ID: {exam.id}</span>
                <Badge className={`${statusColor} shadow-none`}>
                  {statusLabel}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Data de solicitação |{' '}
                {format(new Date(exam.requestDate), 'dd/MM/yyyy', {
                  locale: ptBR,
                })}
              </div>
              {exam.completionDate && (
                <div className="text-sm text-gray-600">
                  Data de realização |{' '}
                  {format(new Date(exam.completionDate), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-50">
        <iframe
          src={exam.examUrl}
          className="h-full w-full border-0"
          title="Resultado do exame"
          allow="fullscreen"
        />
      </div>
    </div>
  )
}
