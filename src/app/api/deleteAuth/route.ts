/**
 * 🗑️ API DE DELEÇÃO DE USUÁRIO (ADMIN)
 *
 * Endpoint para deletar usuários usando Firebase Admin SDK
 * - Validação de UID de entrada
 * - Verificação de existência do usuário
 * - Deleção segura via Admin SDK
 * - Tratamento de erros padronizado
 * - Logs de auditoria para segurança
 */

import admin from 'firebase-admin'
import { NextResponse } from 'next/server'

import { initAdmin } from '@/config/firebase/firebaseAdmin'
import { deleteUserAuthAdmin } from '@/services/firebase/firebaseAdmin'

// ====================================================================
// 📋 TIPOS
// ====================================================================

/**
 * Dados de entrada para deleção de usuário
 */
interface DeleteUserRequest {
  id: string // UID do usuário a ser deletado
}

/**
 * Resposta da API
 */
interface DeleteUserResponse {
  error: string | null
  success?: boolean
  deletedUserId?: string
}

// ====================================================================
// 🔧 VALIDAÇÕES
// ====================================================================

/**
 * Valida dados de entrada da requisição
 */
function validateDeleteUserData(data: unknown): data is DeleteUserRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    (data as { id: string }).id.length > 0 &&
    (data as { id: string }).id.trim() !== ''
  )
}

/**
 * Verifica se UID tem formato válido
 */
function isValidUID(uid: string): boolean {
  // UIDs do Firebase geralmente têm 28 caracteres alfanuméricos
  const uidRegex = /^[a-zA-Z0-9]{20,}$/
  return uidRegex.test(uid)
}

// ====================================================================
// 🚀 HANDLER PRINCIPAL
// ====================================================================

/**
 * Endpoint POST para deleção de usuário
 *
 * Fluxo:
 * 1. Valida dados de entrada (UID)
 * 2. Inicializa Firebase Admin
 * 3. Verifica se usuário existe
 * 4. Deleta usuário via Admin SDK
 * 5. Retorna resultado da operação
 *
 * @param request - Requisição HTTP com { id: userUID }
 * @returns NextResponse com { error, success, deletedUserId }
 *
 * Uso:
 * ```typescript
 * const response = await fetch('/api/deleteAuth', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ id: userUID })
 * })
 * ```
 */
export async function POST(
  request: Request,
): Promise<NextResponse<DeleteUserResponse>> {
  try {
    // ====================================================================
    // 📥 VALIDAÇÃO DE ENTRADA
    // ====================================================================

    const body = await request.json()

    // 🔍 Valida estrutura dos dados
    if (!validateDeleteUserData(body)) {
      return NextResponse.json(
        {
          error: 'UID do usuário é obrigatório e deve ser uma string válida.',
          success: false,
        },
        { status: 400 },
      )
    }

    const { id: userUID } = body

    // 🆔 Valida formato do UID
    if (!isValidUID(userUID)) {
      return NextResponse.json(
        {
          error: 'Formato de UID inválido.',
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
    // 👤 VERIFICAÇÃO DE EXISTÊNCIA DO USUÁRIO
    // ====================================================================

    /**
     * Verifica se usuário existe antes de tentar deletar
     * Evita operações desnecessárias e melhora feedback
     */
    // Removed unused variable userExists
    let userEmail = ''

    try {
      const userRecord = await admin.auth().getUser(userUID)
      userEmail = userRecord.email || 'email-não-disponível'
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'auth/user-not-found') {
        return NextResponse.json(
          {
            error: 'Usuário não encontrado.',
            success: false,
          },
          { status: 404 },
        )
      } else {
        // 📝 Log erro inesperado na verificação
        console.error('Erro ao verificar usuário:', {
          userUID,
          error: (error as { message: string }).message,
        })

        return NextResponse.json(
          {
            error: 'Erro ao verificar usuário. Tente novamente.',
            success: false,
          },
          { status: 500 },
        )
      }
    }

    // ====================================================================
    // 🗑️ DELEÇÃO DO USUÁRIO
    // ====================================================================

    /**
     * Log de auditoria ANTES da deleção
     * Importante para rastreabilidade
     */
    console.log('Iniciando deleção de usuário:', {
      userUID,
      userEmail,
      timestamp: new Date().toISOString(),
    })

    const { error } = await deleteUserAuthAdmin(userUID)

    if (error) {
      // 📝 Log erro na deleção
      console.error('Erro na deleção do usuário:', {
        userUID,
        userEmail,
        error,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json(
        {
          error,
          success: false,
        },
        { status: 500 },
      )
    }

    // ✅ Sucesso na deleção
    console.log('Usuário deletado com sucesso:', {
      userUID,
      userEmail,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        error: null,
        success: true,
        deletedUserId: userUID,
      },
      { status: 200 },
    )
  } catch (error) {
    // ====================================================================
    // 🚨 TRATAMENTO DE ERROS INESPERADOS
    // ====================================================================

    console.error('Erro inesperado na API deleteAuth:', {
      error,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        error: 'Erro interno do servidor. Tente novamente.',
        success: false,
      },
      { status: 500 },
    )
  }
}
