'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import InputField from '@/components/molecules/InputField/inputField'
import { successToast } from '@/hooks/useAppToast'
import useAuth from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import ForgotPasswordSchema, {
  ForgotPasswordFormData,
} from '@/validations/forgotPassword'

export function ForgotPasswordForm() {
  const { forgotPassword, loading } = useAuth()

  const {
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm<ForgotPasswordFormData>({
    mode: 'onChange',
    resolver: zodResolver(ForgotPasswordSchema),
  })

  const handleSubmitForm = (data: ForgotPasswordFormData) => {
    forgotPassword(data.email)
    successToast(
      'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
    )
  }

  const isFormLoading = loading.forgotPassword

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-col items-start gap-2 pb-24">
        <h4 className="text-3xl font-bold text-[#530570]">Redefinir Senha</h4>
        <span className="text-md text-gray-600">
          Digite seu e-mail para receber o link de redefinição.
        </span>
      </div>
      <form
        onSubmit={handleSubmit(handleSubmitForm)}
        className="flex w-full flex-col gap-4"
      >
        <div className="flex justify-center">
          <Image
            src="/recoverypassword.png"
            alt="Logo Upsaude"
            width={300}
            height={300}
          />
        </div>
        <InputField
          name="email"
          control={control}
          label="E-mail de cadastro"
          type="text"
          placeholder="seu@email.com"
          required
          disabled={isFormLoading}
        />

        <Button
          type="submit"
          size="lg"
          className={cn(
            'w-full font-semibold',
            'bg-purple-800 hover:bg-purple-900 focus:ring-purple-500',
          )}
          loading={isFormLoading}
          disabled={isFormLoading || !isValid}
        >
          {isFormLoading ? 'Enviando...' : 'Enviar Link'}
        </Button>
      </form>
    </div>
  )
}
