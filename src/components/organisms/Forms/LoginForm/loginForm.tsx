'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Apple } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import InputField from '@/components/molecules/InputField/inputField'
import SignInFormSchema, { SignInFormData } from '@/validations/signIn'
import { Button } from '@atoms/Button/button'
import useAuth from '@hooks/useAuth'
export function LoginForm() {
  const { loginWithInternalService, loginWithGoogle, loginWithApple, loading } =
    useAuth()
  const router = useRouter()
  const {
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm<SignInFormData>({
    mode: 'onChange',
    resolver: zodResolver(SignInFormSchema),
  })

  const handleSubmitForm = (data: SignInFormData) => {
    loginWithInternalService(data.email, data.password)
  }

  const handleGoogleLogin = async () => {
    await loginWithGoogle()
  }

  const handleAppleLogin = async () => {
    await loginWithApple()
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <div className="flex min-w-0 flex-col items-start gap-2 pb-6 sm:pb-12 lg:pb-24">
        <h4 className="min-w-0 text-2xl font-bold leading-tight text-[#530570] sm:text-3xl">
          Bem-vindo de volta,
          <br />
          profissional de saúde
        </h4>
        <span className="text-sm text-gray-600 sm:text-base">
          Sua jornada começa no Up Saúde!
        </span>
      </div>
      <form
        className="flex w-full min-w-0 flex-col gap-4"
        onSubmit={handleSubmit(handleSubmitForm)}
      >
        <InputField
          name="email"
          control={control}
          label="E-mail"
          type="text"
          placeholder="seu@email.com"
          required
          disabled={loading.loginWithInternalService}
          className="transition-all duration-200"
        />

        <InputField
          name="password"
          control={control}
          label="Senha"
          type="password"
          placeholder="Digite sua senha"
          required
          disabled={loading.loginWithInternalService}
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

        <>
          <div className="flex w-full min-w-0 flex-col gap-6">
            <div className="flex min-w-0 items-center justify-center py-6 sm:py-8">
              <div className="min-w-0 flex-1 border-t border-gray-300" />
              <span className="shrink-0 bg-white px-2 text-sm text-gray-500">
                Ou entre com
              </span>
              <div className="min-w-0 flex-1 border-t border-gray-300" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                variant="secondary-gray"
                icon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                disabled={loading.loginWithGoogle}
                loading={loading.loginWithGoogle}
                className="text-transform-none w-full border-gray-300 p-2 text-gray-800 hover:border-gray-400 hover:bg-gray-100"
              >
                Google
              </Button>
              <Button
                variant="secondary-gray"
                icon={<Apple />}
                onClick={handleAppleLogin}
                disabled={loading.loginWithApple}
                loading={loading.loginWithApple}
                className="text-transform-none w-full border-gray-300 p-2 text-gray-800 hover:border-gray-400 hover:bg-gray-100"
              >
                Apple
              </Button>
            </div>
          </div>
        </>

        <Button
          type="submit"
          className="mt-4"
          loading={loading.loginWithInternalService}
          disabled={!isValid || loading.loginWithInternalService}
        >
          Entrar
        </Button>
      </form>
    </div>
  )
}
