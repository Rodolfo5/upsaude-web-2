'use client'

import { MessageSquare as QuestionAnswerOutlinedIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/atoms/Button/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import useChatsByDoctor from '@/hooks/queries/useChatsByDoctor'
import { useCreateChat } from '@/hooks/queries/useCreateChat'
import { usePatient } from '@/hooks/usePatient'
import useUser from '@/hooks/useUser'
import { calculateAge } from '@/utils/calculateAge'

interface Props {
  patientId: string
  isAdmin?: boolean
  isQRCodePendingDoctor?: boolean
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-primary-500">{label}</p>
      <p className="text-sm text-gray-700">{value || '-'}</p>
    </div>
  )
}
function getSocialName(name: string, socialName?: string) {
  if (!socialName) return name

  const normalized = socialName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return ['nao precisa', ''].includes(normalized) ? name : socialName
}

export default function PatientBasicInfoCard({
  patientId,
  isAdmin = false,
  isQRCodePendingDoctor = false,
}: Props) {
  const { patient, loading, error } = usePatient(patientId)
  const router = useRouter()
  const { currentUser } = useUser()
  const { data: chats } = useChatsByDoctor()
  const { mutate: createChat } = useCreateChat()

  const handleSendMessage = () => {
    if (!currentUser?.id) return

    const existingChat = chats?.find((chat) => chat.patientId === patientId)

    if (existingChat) {
      router.push(`/chat?chatId=${existingChat.id}`)
    } else {
      createChat(
        {
          patientId,
          doctorId: currentUser.id,
        },
        {
          onSuccess: (result) => {
            if (!result.error && result.id) {
              router.push(`/chat?chatId=${result.id}`)
            }
          },
        },
      )
    }
  }

  if (loading) return <div>Carregando dados básicos...</div>
  if (error) return <div>Erro: {error}</div>
  if (!patient) return <div>Paciente não encontrado</div>

  const socialName = getSocialName(patient.name, patient.socialName)
  const initials = patient.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="w-full max-w-2xl space-y-4 rounded-3xl border-gray-200 p-4 shadow-none">
      <div className="flex items-start gap-8 md:gap-12">
        <div className="flex flex-col items-center">
          <Avatar className="h-20 w-20 md:h-28 md:w-28">
            {patient.profileImage && (
              <AvatarImage src={patient.profileImage} alt={patient.name} />
            )}
            <AvatarFallback className="bg-purple-100 text-lg text-purple-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          {patient.isDependent && (
            <Badge
              variant="outline"
              className="mt-4 flex items-center justify-center rounded-full border border-gray-300 px-1 text-xs font-normal text-gray-300"
            >
              Dependente
            </Badge>
          )}
        </div>

        <div className="mt-1 flex-1 space-y-1">
          <InfoRow label="Nome social" value={socialName} />
          <InfoRow label="CPF" value={patient.cpf} />
          <InfoRow label="Idade" value={calculateAge(patient.birthDate)} />
          {!isAdmin && !isQRCodePendingDoctor && (
            <Button
              icon={<QuestionAnswerOutlinedIcon fontSize="small" />}
              className="mt-2 h-7 text-xs"
              onClick={handleSendMessage}
            >
              Enviar mensagem
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
