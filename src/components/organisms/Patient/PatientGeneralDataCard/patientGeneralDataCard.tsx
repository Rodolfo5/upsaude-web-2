'use client'

import { Card } from '@/components/ui/card'
import { usePatient } from '@/hooks/usePatient'

interface Props {
  patientId: string
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <p className="text-sm text-primary-500">{label}</p>
      <p className="text-sm text-gray-700">{value || '-'}</p>
    </div>
  )
}

export default function PatientGeneralDataCard({ patientId }: Props) {
  const { patient, loading, error } = usePatient(patientId)

  if (loading) return <div>Carregando dados gerais...</div>
  if (error) return <div>Erro: {error}</div>
  if (!patient) return <div>Dados não encontrados</div>

  return (
    <Card className="w-full space-y-5 rounded-3xl border-gray-200 p-6 shadow-none">
      <h3 className="text-lg font-medium text-brand-purple-dark-500">
        Dados gerais
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3">
        <InfoRow label="Nome completo" value={patient.name} />
        <InfoRow
          label="Data de nascimento"
          value={
            patient.birthDate
              ? new Date(patient.birthDate).toLocaleDateString()
              : '-'
          }
        />
        <InfoRow label="Tipo sanguíneo" value={patient.bloodType} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <InfoRow label="Sexo biológico" value={patient.sex} />
        <InfoRow label="Gênero" value={patient.gender} />
        <InfoRow label="Altura" value={patient.height} />
        <InfoRow label="Peso" value={patient.weight} />
      </div>
    </Card>
  )
}
