'use client'

import { ArrowUpRight as ArrowOutwardOutlinedIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

import { Card } from '@/components/ui/card'

interface Shortcut {
  id: string
  title: string
  href: string
}

interface Props {
  patientId: string
  className?: string
}

export default function ShortcurtCard({ patientId, className = '' }: Props) {
  const router = useRouter()

  const items: Shortcut[] = [
    {
      id: 'questionarios',
      title: 'Questionários solicitados',
      href: `/pacientes/${patientId}/questionnaires`,
    },
    {
      id: 'exames',
      title: 'Últimos exames',
      href: `/pacientes/${patientId}/exames`,
    },
    {
      id: 'medicamentos',
      title: 'Lista de medicamentos',
      href: `/pacientes/${patientId}/medicamentos`,
    },
    {
      id: 'alimentacao',
      title: 'Detalhes da alimentação',
      href: `/pacientes/${patientId}/alimentacao`,
    },
    {
      id: 'movimento',
      title: 'Detalhes da movimentação',
      href: `/pacientes/${patientId}/movimento`,
    },
    {
      id: 'peso',
      title: 'Detalhes do peso',
      href: `/pacientes/${patientId}/peso`,
    },
    {
      id: 'planos',
      title: 'Histórico de planos terapêuticos',
      href: `/pacientes/${patientId}/planos-terapeuticos`,
    },
    {
      id: 'prontuario',
      title: 'Prontuário',
      href: `/medical-record/${patientId}/`,
    },
  ]

  return (
    <div className={`mt-6 ${className}`}>
      <h3 className="mb-4 text-lg font-normal text-gray-700">Atalhos úteis</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card
            key={item.id}
            className="flex cursor-pointer items-center gap-4 rounded-3xl border-none bg-primary-50 p-6 shadow-none"
            onClick={() => router.push(item.href)}
          >
            <div className="flex flex-col gap-2">
              <ArrowOutwardOutlinedIcon
                fontSize="large"
                className="h-5 w-5 text-primary-600"
              />
              <div className="mt-4 text-xl font-normal text-primary-600">
                {item.title}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
