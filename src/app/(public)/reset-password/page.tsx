import ResetPasswordForm from './Components/ResetPasswordForm'

interface ResetPasswordPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams
  const mode = typeof params.mode === 'string' ? params.mode : ''
  const actionCode = typeof params.oobCode === 'string' ? params.oobCode : ''

  // Se os parâmetros são válidos, mostrar o formulário
  if (mode === 'resetPassword' && actionCode) {
    return <ResetPasswordForm actionCode={actionCode} />
  }

  // Caso contrário, mostrar mensagem de link inválido
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-[#792EBD] to-[#EB34EF]">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-[#792EBD]">
            Link Inválido
          </h1>
          <p className="text-[#792EBD]">
            Este link de redefinição de senha é inválido ou expirou.
          </p>
        </div>
      </div>
    </div>
  )
}
