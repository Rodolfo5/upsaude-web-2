/**
 * 🔐 API DE CRIAÇÃO DE USUÁRIO (ADMIN)
 *
 * Endpoint para criar usuários usando Firebase Admin SDK
 * - Verificação de email existente
 * - Criação segura via Admin SDK
 * - Validação de dados de entrada
 * - Tratamento de erros padronizado
 * - Logs para auditoria
 */

import admin from 'firebase-admin'
import { NextResponse } from 'next/server'

import { initAdmin } from '@/config/firebase/firebaseAdmin'
import { createUserAuthAdmin } from '@/services/firebase/firebaseAdmin'

// ====================================================================
// 📋 TIPOS
// ====================================================================

/**
 * Dados de entrada para criação de usuário
 */
interface CreateUserRequest {
  email: string
  password: string
}

/**
 * Resposta da API
 */
interface CreateUserResponse {
  uid: string | null
  error: string | null
  success?: boolean
}

// ====================================================================
// 🔧 VALIDAÇÕES
// ====================================================================

/**
 * Valida dados de entrada da requisição
 */
function validateCreateUserData(data: unknown): data is CreateUserRequest {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const { email, password } = data as { email?: unknown; password?: unknown }

  return (
    typeof email === 'string' &&
    typeof password === 'string' &&
    email.length > 0 &&
    password.length >= 6
  )
}

/**
 * Verifica se email tem formato válido
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ====================================================================
// 🚀 HANDLER PRINCIPAL
// ====================================================================

/**
 * Endpoint POST para criação de usuário
 *
 * Fluxo:
 * 1. Valida dados de entrada
 * 2. Inicializa Firebase Admin
 * 3. Verifica se email já existe
 * 4. Cria usuário via Admin SDK
 * 5. Retorna UID ou erro
 *
 * @param request - Requisição HTTP com { email, password }
 * @returns NextResponse com { uid, error, success }
 *
 * Uso:
 * ```typescript
 * const response = await fetch('/api/createAuth', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email, password })
 * })
 * ```
 */
export async function POST(
  request: Request,
): Promise<NextResponse<CreateUserResponse>> {
  try {
    // ====================================================================
    // 📥 VALIDAÇÃO DE ENTRADA
    // ====================================================================

    const body = await request.json()

    // 🔍 Valida estrutura dos dados
    if (!validateCreateUserData(body)) {
      return NextResponse.json(
        {
          uid: null,
          error: 'Dados inválidos. Email e senha são obrigatórios.',
          success: false,
        },
        { status: 400 },
      )
    }

    const { email, password } = body

    // 📧 Valida formato do email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          uid: null,
          error: 'Formato de email inválido.',
          success: false,
        },
        { status: 400 },
      )
    }

    // 🔒 Valida força da senha
    if (password.length < 6) {
      return NextResponse.json(
        {
          uid: null,
          error: 'Senha deve ter pelo menos 6 caracteres.',
          success: false,
        },
        { status: 400 },
      )
    }

    // ====================================================================
    // 🔥 INICIALIZAÇÃO DO FIREBASE ADMIN
    // ====================================================================

    await initAdmin()

    // ====================================================================
    // 📧 VERIFICAÇÃO DE EMAIL EXISTENTE
    // ====================================================================

    /**
     * Verifica se email já está em uso
     * Retorna erro consistente com Firebase Auth
     */
    const emailExists = await admin
      .auth()
      .getUserByEmail(email)
      .then(() => true)
      .catch((error) => {
        // 📝 Log apenas erros não esperados (não "user not found")
        if (error.code !== 'auth/user-not-found') {
          console.error('Erro ao verificar email:', error)
        }
        return false
      })

    if (emailExists) {
      return NextResponse.json(
        {
          uid: null,
          error: 'Firebase: Error (auth/email-already-in-use).',
          success: false,
        },
        { status: 409 },
      ) // 409 Conflict
    }

    // ====================================================================
    // 👤 CRIAÇÃO DO USUÁRIO
    // ====================================================================

    const { uid, error } = await createUserAuthAdmin(email, password)

    if (error) {
      // 📝 Log erro para debugging
      console.error('Erro na criação do usuário:', { email, error })

      return NextResponse.json(
        {
          uid: null,
          error,
          success: false,
        },
        { status: 500 },
      )
    }

    // ✅ Sucesso na criação
    console.log('Usuário criado com sucesso:', { uid, email })

    return NextResponse.json(
      {
        uid,
        error: null,
        success: true,
      },
      { status: 201 },
    ) // 201 Created
  } catch (error) {
    // ====================================================================
    // 🚨 TRATAMENTO DE ERROS INESPERADOS
    // ====================================================================

    console.error('Erro inesperado na API createAuth:', error)

    return NextResponse.json(
      {
        uid: null,
        error: 'Erro interno do servidor. Tente novamente.',
        success: false,
      },
      { status: 500 },
    )
  }
}
