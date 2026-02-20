import { NextResponse } from 'next/server'

import { getAdminApp } from '@/config/firebase/firebaseAdmin'
import { createUserAuthAdmin } from '@/services/firebase/firebaseAdmin'

interface CreateDoctorAuthRequest {
  email: string
  password: string
}

interface CreateDoctorAuthResponse {
  uid?: string
  error?: string
}

/**
 * API Route para criar conta de autenticação para paciente
 *
 * Usa Firebase Admin SDK para criar usuário sem afetar a sessão atual
 * do médico logado.
 *
 * IMPORTANTE: Esta rota deve ser chamada ANTES de criar o documento no Firestore
 */
export async function POST(
  request: Request,
): Promise<NextResponse<CreateDoctorAuthResponse>> {
  try {
    const body: CreateDoctorAuthRequest = await request.json()
    const { email, password } = body

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 },
      )
    }

    // Garante que o Firebase Admin está inicializado
    await getAdminApp()

    // Cria usuário usando Admin SDK (não afeta sessão atual)
    const { uid, error } = await createUserAuthAdmin(email, password)

    if (error || !uid) {
      return NextResponse.json(
        { error: error || 'Erro ao criar conta de autenticação' },
        { status: 400 },
      )
    }

    return NextResponse.json({ uid }, { status: 200 })
  } catch (error) {
    console.error('Erro na API createDoctor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
