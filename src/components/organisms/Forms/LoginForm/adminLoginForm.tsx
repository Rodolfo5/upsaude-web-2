'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import InputField from '@/components/molecules/InputField/inputField'
import { errorToast, successToast } from '@/hooks/useAppToast'
import { signInWithEmailAndPasswordLocal } from '@/services/firebase/auth'
import { getUserDoc } from '@/services/user'
import { UserRole } from '@/types/entities/user'
import SignInFormSchema, { SignInFormData } from '@/validations/signIn'
import { Button } from '@atoms/Button/button'
import useAuth from '@hooks/useAuth'

export function AdminLoginForm() {
  const { setUserUid, logoutUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const {
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm<SignInFormData>({
    mode: 'onChange',
    resolver: zodResolver(SignInFormSchema),
  })

  const handleSubmitForm = async (data: SignInFormData) => {
    setLoading(true)

    try {
      const { error, user } = await signInWithEmailAndPasswordLocal(
        data.email,
        data.password,
      )

      if (error || !user) {
        errorToast(error || 'Erro ao fazer login')
        setLoading(false)
        return
      }

      const { user: userData, error: userError } = await getUserDoc(user.uid)

      if (userError || !userData) {
        errorToast('Erro ao verificar permissões de acesso')
        await logoutUser()
        setLoading(false)
        return
      }

      if (userData.role !== UserRole.ADMIN) {
        errorToast('Acesso negado. Esta área é exclusiva para administradores.')
        await logoutUser()
        setLoading(false)
        return
      }

      successToast('Bem-vindo, Administrador!')
      setUserUid(user.uid)
      router.push('/admin/home')
    } catch (error) {
      console.error('Erro no login admin:', error)
      errorToast('Erro inesperado ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-col items-start gap-2 pb-24">
        <h4 className="text-3xl font-bold text-[#530570]">
          Acesso Administrativo
        </h4>
        <span className="text-md text-gray-600">
          Área exclusiva para administradores do sistema
        </span>
      </div>
      <form
        className="flex w-full flex-col gap-4"
        onSubmit={handleSubmit(handleSubmitForm)}
      >
        <InputField
          name="email"
          control={control}
          label="E-mail"
          type="text"
          placeholder="admin@upsaude.com"
          required
          disabled={loading}
          className="transition-all duration-200"
        />

        <InputField
          name="password"
          control={control}
          label="Senha"
          type="password"
          placeholder="Digite sua senha"
          required
          disabled={loading}
          className="transition-all duration-200"
        />

        <div className="flex justify-start">
          <span
            onClick={() => router.push('/recuperar-senha')}
            className="cursor-pointer text-sm text-purple-600 transition-colors hover:text-purple-600"
          >
            Esqueceu a senha?
          </span>
        </div>

        <Button
          type="submit"
          className="mt-4"
          loading={loading}
          disabled={!isValid || loading}
        >
          Entrar como Admin
        </Button>
      </form>
    </div>
  )
}

