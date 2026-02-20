'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Apple, Google } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import InputField from '@/components/molecules/InputField/inputField'
import SignInFormSchema, { SignInFormData } from '@/validations/signIn'
import { Button } from '@atoms/Button/button'
import useAuth from '@hooks/useAuth'
export function LoginForm() {
  const { loginWithInternalService, loginWithGoogle, loginWithApple, loading } = useAuth()
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
                icon={<Google />}
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
