'use client'

import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/atoms/Button/button'
import { Card } from '@/components/ui/card'
import useChatsByDoctor from '@/hooks/queries/useChatsByDoctor'
import { useCreateChat } from '@/hooks/queries/useCreateChat'
import { usePatient } from '@/hooks/usePatient'
import useUser from '@/hooks/useUser'

interface Props {
  accountHolderId: string
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-primary-500">{label}</p>
      <p className="text-sm text-gray-700">{value || '-'}</p>
    </div>
  )
}

export default function PatientAccountHolderCard({ accountHolderId }: Props) {
  const { patient: holder, loading, error } = usePatient(accountHolderId)
  const router = useRouter()
  const { currentUser } = useUser()
  const { data: chats } = useChatsByDoctor()
  const { mutate: createChat } = useCreateChat()

  if (loading) return <div>Carregando dados do responsável...</div>
  if (error) return <div>Erro: {error}</div>
  if (!holder) return <div>Responsável não encontrado</div>

  const handleSendMessage = () => {
    if (!currentUser?.id) return

    const existingChat = chats?.find(
      (chat) => chat.patientId === accountHolderId,
    )

    if (existingChat) {
      router.push(`/chat?chatId=${existingChat.id}`)
    } else {
      createChat(
        {
          patientId: accountHolderId,
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

  return (
    <Card className="w-full space-y-6 rounded-3xl border-gray-200 p-6 shadow-none">
      <h3 className="text-lg font-medium text-brand-purple-dark-500">
        Dados do responsável
      </h3>

      <div className="space-y-1">
        <div className="flex gap-12">
          <InfoRow label="Nome" value={holder.name} />
          <InfoRow label="Telefone" value={holder.phoneNumber} />
        </div>
        <div className="flex items-center gap-12">
          <InfoRow label="Email" value={holder.email} />

          <Button
            icon={
              <QuestionAnswerOutlinedIcon
                fontSize="small"
                viewBox="0 -7 10 38"
              />
            }
            className="mt-3 h-6 px-0.5 text-xs font-normal"
            onClick={handleSendMessage}
            variant={'outline'}
          >
            Enviar mensagem
          </Button>
        </div>
      </div>
    </Card>
  )
}
