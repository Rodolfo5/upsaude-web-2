'use client'

import { ForgotPasswordForm } from '@/components/organisms/Forms/ForgotPasswordForm/forgotPasswordForm'
import AuthTemplate from '@/components/templates/AuthTemplate/authTemplate'

export default function ForgotPasswordPage() {
  return (
    <AuthTemplate
      title="Redefinir Senha"
      subtitle="Digite seu e-mail para receber o link de redefinição."
      form={<ForgotPasswordForm />}
      footerLink={{
        text: 'Voltar ao ',
        linkText: 'login',
        href: '/login',
      }}
    />
  )
}
