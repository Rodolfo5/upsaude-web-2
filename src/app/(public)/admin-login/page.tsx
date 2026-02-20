'use client'

import { AdminLoginForm } from '@/components/organisms/Forms/LoginForm/adminLoginForm'
import AuthTemplate from '@/components/templates/AuthTemplate/authTemplate'

export default function AdminLoginPage() {
  return (
    <AuthTemplate
      title="Acesso Admin"
      subtitle="Acesso exclusivo para administradores"
      form={<AdminLoginForm />}
    />
  )
}
