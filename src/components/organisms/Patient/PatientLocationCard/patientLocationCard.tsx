'use client'

import { Card } from '@/components/ui/card'
import { usePatient } from '@/hooks/usePatient'

interface Props {
  patientId: string
  hasAccountHolder?: boolean
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <p className="text-sm text-primary-500">{label}</p>
      <p className="text-sm text-gray-700">{value || '-'}</p>
    </div>
  )
}

export default function PatientLocationCard({
  patientId,
  hasAccountHolder,
}: Props) {
  const { patient, loading, error } = usePatient(patientId)

  if (loading) return <div>Carregando dados de localização...</div>
  if (error) return <div>Erro: {error}</div>
  if (!patient) return <div>Dados não encontrados</div>

  return (
    <Card
      className={`w-full space-y-4 rounded-3xl border-gray-200 p-4 shadow-none ${
        !hasAccountHolder ? 'min-h-[270px]' : ''
      }`}
    >
      <h3 className="mt-2 text-lg font-medium text-brand-purple-dark-500">
        Localidade
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        <InfoRow label="CEP" value={patient.cep} />
        <InfoRow label="Endereço" value={patient.address} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoRow label="Cidade" value={patient.city} />
        <InfoRow label="Complemento" value={patient.complement} />
        <InfoRow label="Bairro" value={patient.neighborhood} />
      </div>
    </Card>
  )
}
