/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
  getAuth,
} from 'firebase/auth'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import firebaseApp from '@/config/firebase/firebase'

import {
  PasswordRequirements,
  resetPasswordSchema,
  ResetPasswordFormDataSchema,
} from '../types'

const auth = getAuth(firebaseApp)

interface ResetPasswordFormProps {
  actionCode: string
}

export default function ResetPasswordForm({
  actionCode,
}: ResetPasswordFormProps) {
  const [email, setEmail] = useState<string>('')
  const [requirements, setRequirements] = useState<PasswordRequirements>({
    length: false,
    hasLetter: false,
    hasNumber: false,
    noSpaces: false,
    maxLength: false,
  })
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<{
    new: boolean
    confirm: boolean
  }>({
    new: false,
    confirm: false,
  })
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormDataSchema>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  })

  const newPassword = watch('newPassword', '')

  useEffect(() => {
    verifyPasswordResetCode(auth, actionCode)
      .then((email) => {
        setEmail(email)
      })
      .catch((error: any) => {
        console.error('Erro ao verificar código de redefinição:', error)
        setMessage({
          text: 'O link de redefinição de senha é inválido ou expirou.',
          type: 'error',
        })
      })
  }, [actionCode])

  // Atualizar requisitos de senha em tempo real
  useEffect(() => {
    const password = newPassword || ''
    const newRequirements = {
      length: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
      noSpaces: !/\s/.test(password),
      maxLength: password.length <= 32,
    }
    setRequirements(newRequirements)
  }, [newPassword])

  const onSubmit = async (data: ResetPasswordFormDataSchema) => {
    setLoading(true)
    setMessage(null)

    try {
      await confirmPasswordReset(auth, actionCode, data.newPassword)
      setShowSuccessModal(true)
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error)

      let errorMessage = 'Erro ao redefinir a senha. Tente novamente.'

      if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'O link de redefinição de senha é inválido ou expirou.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha é muito fraca. Escolha uma senha mais forte.'
        setError('newPassword', {
          type: 'manual',
          message: 'A senha é muito fraca',
        })
      } else if (error.code === 'auth/expired-action-code') {
        errorMessage =
          'O link de redefinição de senha expirou. Solicite um novo link.'
      }

      setMessage({
        text: errorMessage,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-[#792EBD] to-[#EB34EF] px-4 py-12 sm:px-6 lg:px-8">
      <Image src="/logoupsaude.png" alt="Upsaude" width={150} height={150} />
      <div className="mt-4 w-full max-w-md overflow-hidden rounded-lg bg-white shadow-md">
        <div className="p-8">
          <h1 className="mb-4 text-center text-xl font-bold text-[#792EBD]">
            Redefinir sua senha
          </h1>

          <p className="mb-6 text-center text-gray-700">
            Digite uma nova senha para sua conta. Certifique-se de que ela
            atenda aos requisitos de segurança abaixo.
          </p>

          {email && (
            <div className="mb-6 flex items-center justify-center rounded-lg bg-blue-50 p-4">
              <i className="fas fa-envelope mr-2 text-red-600"></i>
              <span className="font-medium text-blue-900">{email}</span>
            </div>
          )}

          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 flex items-center font-semibold text-[#792EBD]">
              <i className="fas fa-shield-alt mr-2 text-red-600"></i>
              Requisitos de senha
            </h3>

            <div
              className={`mb-1 flex items-center ${requirements.length ? 'text-green-600' : 'text-gray-500'}`}
            >
              <i
                className={`fas ${requirements.length ? 'fa-check-circle' : 'fa-circle'} mr-2`}
              ></i>
              <span>Pelo menos 8 caracteres</span>
            </div>

            <div
              className={`mb-1 flex items-center ${requirements.maxLength ? 'text-green-600' : 'text-gray-500'}`}
            >
              <i
                className={`fas ${requirements.maxLength ? 'fa-check-circle' : 'fa-circle'} mr-2`}
              ></i>
              <span>Máximo 32 caracteres</span>
            </div>

            <div
              className={`mb-1 flex items-center ${requirements.hasLetter ? 'text-green-600' : 'text-gray-500'}`}
            >
              <i
                className={`fas ${requirements.hasLetter ? 'fa-check-circle' : 'fa-circle'} mr-2`}
              ></i>
              <span>Pelo menos 1 letra</span>
            </div>

            <div
              className={`mb-1 flex items-center ${requirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}
            >
              <i
                className={`fas ${requirements.hasNumber ? 'fa-check-circle' : 'fa-circle'} mr-2`}
              ></i>
              <span>Pelo menos 1 número</span>
            </div>

            <div
              className={`flex items-center ${requirements.noSpaces ? 'text-green-600' : 'text-gray-500'}`}
            >
              <i
                className={`fas ${requirements.noSpaces ? 'fa-check-circle' : 'fa-circle'} mr-2`}
              ></i>
              <span>Sem espaços em branco</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <label
                htmlFor="newPassword"
                className="mb-1 block text-sm font-medium text-[#792EBD]"
              >
                <i className="fas fa-lock mr-2 text-red-600"></i>
                Nova senha
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword.new ? 'text' : 'password'}
                  {...register('newPassword')}
                  className={`block w-full appearance-none rounded border px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.newPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                  }`}
                  placeholder="Digite sua nova senha"
                />

                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  <i
                    className={`fas ${showPassword.new ? 'fa-eye-slash' : 'fa-eye'} text-gray-400`}
                  ></i>
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-[#792EBD]"
              >
                <i className="fas fa-lock mr-2 text-red-600"></i>
                Confirmar nova senha
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword.confirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={`block w-full appearance-none rounded border px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                  }`}
                  placeholder="Digite novamente sua nova senha"
                />

                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  <i
                    className={`fas ${showPassword.confirm ? 'fa-eye-slash' : 'fa-eye'} text-gray-400`}
                  ></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="mb-4 h-1 rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full ${
                  newPassword.length === 0
                    ? 'bg-gray-200'
                    : newPassword.length < 4
                      ? 'bg-red-600'
                      : newPassword.length < 8
                        ? 'bg-yellow-500'
                        : 'bg-green-600'
                }`}
                style={{
                  width: `${Math.min(100, (newPassword.length / 8) * 100)}%`,
                }}
              ></div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-full border border-transparent bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <i className="fas fa-key mr-2"></i>
              {loading ? 'Processando...' : 'Redefinir senha'}
            </Button>
          </form>

          {message && (
            <div
              className={`mt-4 rounded-md p-3 ${message.type === 'success' ? 'border-l-4 border-green-500 bg-green-100 text-green-700' : 'border-l-4 border-red-500 bg-red-100 text-red-700'}`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 pt-6 text-center">
            <p className="font-merriweather text-sm text-gray-600">
              © 2025 UPSAÚDE. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showSuccessModal}
        setIsOpen={setShowSuccessModal}
        title="Senha alterada com sucesso"
        description="Sua senha foi redefinida com sucesso!"
        content="Retorne para o aplicativo para fazer login com sua nova senha."
        actionLabel="Entendi"
        action={() => setShowSuccessModal(false)}
      />
    </div>
  )
}
