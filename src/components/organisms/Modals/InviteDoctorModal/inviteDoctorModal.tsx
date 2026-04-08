'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import InputField from '@/components/molecules/InputField/inputField'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { successToast } from '@/hooks/useAppToast'
import emailSchema from '@/validations/email'

import { InviteDoctorModalProps } from './types'

const inviteDoctorSchema = z.object({
  email: emailSchema,
})

type InviteDoctorFormData = z.infer<typeof inviteDoctorSchema>

export function InviteDoctorModal({
  isOpen,
  setIsOpen,
}: InviteDoctorModalProps) {
  const [generatedLink, setGeneratedLink] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const {
    handleSubmit,
    control,
    formState: { isValid },
    reset,
  } = useForm<InviteDoctorFormData>({
    mode: 'onChange',
    resolver: zodResolver(inviteDoctorSchema),
  })

  const handleGenerateLink = (data: InviteDoctorFormData) => {
    const baseUrl = window.location.origin
    const encodedEmail = encodeURIComponent(data.email)
    const inviteToken = btoa(data.email)
    const link = `${baseUrl}/cadastro?email=${encodedEmail}&token=${inviteToken}`
    setGeneratedLink(link)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      successToast('Link copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar link:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setGeneratedLink('')
    setCopied(false)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader className="items-start text-left">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Mail className="h-6 w-6 text-purple-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Convidar Novo Médico
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {generatedLink
              ? 'Link gerado com sucesso! Copie e envie para o médico.'
              : 'Digite o e-mail do médico para gerar um link de cadastro único.'}
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <form
            onSubmit={handleSubmit(handleGenerateLink)}
            className="space-y-4"
          >
            <InputField
              name="email"
              control={control}
              label="E-mail do Médico"
              type="text"
              placeholder="medico@example.com"
              required
              className="transition-all duration-200"
            />

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary-gray"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="success"
                disabled={!isValid}
                className="flex-1"
              >
                Gerar Link
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="break-all text-sm text-gray-700">{generatedLink}</p>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary-gray"
                className="flex-1"
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={handleCopyLink}
                variant="success"
                className="flex-1"
                icon={
                  copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )
                }
              >
                {copied ? 'Copiado!' : 'Copiar Link'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
