'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import useUser from '@/hooks/useUser'
import { logout } from '@/services/firebase/auth'
import { DoctorEntity } from '@/types/entities/user'

export function SignUpSuccess() {
  const router = useRouter()
  const { currentUser } = useUser()
  const [patientId, setPatientId] = useState<string | null>(null)
  const [isFromQRCode, setIsFromQRCode] = useState(false)

  useEffect(() => {
    // Check if user came from QR Code flow (using Firebase data)
    const doctor = currentUser as DoctorEntity | null
    if (doctor?.fromQRCode && doctor?.qrCodePatientId) {
      setIsFromQRCode(true)
      setPatientId(doctor.qrCodePatientId)
    } else {
      // Fallback to localStorage
      const callback = localStorage.getItem('medicalRecordCallback')
      if (callback) {
        try {
          const url = new URL(callback)
          const id = url.searchParams.get('patientId')
          if (id) {
            setIsFromQRCode(true)
            setPatientId(id)
          }
        } catch (error) {
          console.error('Error parsing callback URL:', error)
        }
      }
    }
  }, [currentUser])

  const handleViewMedicalRecord = () => {
    if (patientId) {
      // Clear the callback from localStorage
      localStorage.removeItem('medicalRecordCallback')
      // Redirect to the medical record page
      router.push(`/medical-record/${patientId}`)
    }
  }

  // If user came from QR Code flow, show different success screen
  if (isFromQRCode && patientId) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Cadastro concluído com sucesso!
        </h2>

        <div className="space-y-2 text-gray-600">
          <p>
            Seu cadastro foi realizado! Você já pode visualizar o prontuário do
            paciente.
          </p>
          <p className="text-sm">
            Para ter acesso completo ao Up Saúde, aguarde a aprovação do seu
            cadastro. Você receberá um e-mail assim que for aprovado.
          </p>
        </div>

        <Image
          src="/cadastrocompleto.png"
          alt="Success"
          width={300}
          height={300}
        />

        <div className="flex w-full max-w-xs flex-col gap-3">
          <Button
            onClick={handleViewMedicalRecord}
            size="lg"
            className="w-full font-semibold"
          >
            Visualizar Prontuário
          </Button>

          <Button
            onClick={logout}
            variant="outline"
            size="lg"
            className="w-full font-semibold"
          >
            Voltar para o login
          </Button>
        </div>
      </div>
    )
  }

  // Default success screen (not from QR Code)
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-6 text-center">
      <h2 className="text-2xl font-bold text-gray-800">
        Cadastro concluído com sucesso!
      </h2>

      <div className="space-y-2 text-gray-600">
        <p>
          Agora é necessário aguardar a sua aprovação para ter acesso completo
          ao Up Saúde.
        </p>
        <p>Você receberá um e-mail assim que a aprovação for processada.</p>
      </div>

      <Image
        src="/cadastrocompleto.png"
        alt="Success"
        width={300}
        height={300}
      />

      <Button
        onClick={logout}
        size="lg"
        className="w-full max-w-xs font-semibold"
      >
        Voltar para o login
      </Button>
    </div>
  )
}
