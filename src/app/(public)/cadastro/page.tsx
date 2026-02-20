'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { SignUpForm } from '@/components/organisms/Forms/SignUpForm/signUpForm'
import AuthTemplate from '@/components/templates/AuthTemplate/authTemplate'

function SignUpContent() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email')
  const tokenParam = searchParams.get('token')
  const callbackParam = searchParams.get('callback')

  // Save callback in localStorage if exists
  if (callbackParam && typeof window !== 'undefined') {
    localStorage.setItem(
      'medicalRecordCallback',
      decodeURIComponent(callbackParam),
    )
  }

  // Validate token (simple base64 decode check)
  let prefilledEmail: string | undefined
  if (emailParam && tokenParam) {
    try {
      const decodedEmail = atob(tokenParam)
      if (decodedEmail === decodeURIComponent(emailParam)) {
        prefilledEmail = decodedEmail
      }
    } catch (error) {
      console.error('Invalid token:', error)
    }
  }

  return <SignUpForm prefilledEmail={prefilledEmail} />
}

export default function SignUpPage() {
  return (
    <AuthTemplate
      title="Criar conta"
      subtitle="Preencha os dados para começar"
      form={
        <Suspense
          fallback={
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          }
        >
          <SignUpContent />
        </Suspense>
      }
      footerLink={{
        text: 'Já tem uma conta?',
        linkText: 'Faça login',
        href: '/login',
      }}
    />
  )
}
