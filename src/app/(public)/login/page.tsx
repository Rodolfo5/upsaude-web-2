'use client'

import { Apple, Google } from '@mui/icons-material'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { LoginForm } from '@/components/organisms/Forms/LoginForm/loginForm'
import AuthTemplate from '@/components/templates/AuthTemplate/authTemplate'
import { Button } from '@atoms/Button/button'
import useAuth from '@hooks/useAuth'

export default function LoginPage() {
  const { loading } = useAuth()
  const searchParams = useSearchParams()
  const callbackParam = searchParams.get('callback')

  // Save callback in localStorage if exists in URL
  useEffect(() => {
    if (callbackParam && typeof window !== 'undefined') {
      localStorage.setItem(
        'medicalRecordCallback',
        decodeURIComponent(callbackParam),
      )
    }
  }, [callbackParam])

  // Build cadastro URL with callback if exists
  const cadastroHref = callbackParam
    ? `/cadastro?callback=${encodeURIComponent(callbackParam)}`
    : '/cadastro'

  return (
    <AuthTemplate
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar"
      form={<LoginForm />}
      footerLink={{
        text: 'Não tem conta?',
        linkText: 'Cadastre-se',
        href: cadastroHref,
      }}
      secondaryAction={
        <div className="flex flex-col gap-3">
          <Button
            variant="secondary-gray"
            icon={<Google />}
            onClick={() => {
              // TODO: Implement Google login
            }}
            disabled={loading.loginWithGoogle}
            className="text-transform-none border-gray-300 p-2 text-gray-800 hover:border-gray-400 hover:bg-gray-100"
          >
            Google
          </Button>

          <Button
            variant="secondary-gray"
            icon={<Apple />}
            disabled={loading.loginWithApple}
            className="text-transform-none border-gray-300 p-2 text-gray-800 hover:border-gray-400 hover:bg-gray-100"
          >
            Apple
          </Button>
        </div>
      }
    />
  )
}
