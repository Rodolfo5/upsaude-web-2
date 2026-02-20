/**
 * 🔐 SERVICE DE AUTENTICAÇÃO ADMIN - FIREBASE ADMIN SDK
 *
 * Este arquivo contém operações administrativas de autenticação que só podem
 * ser executadas no servidor com privilégios de administrador.
 *
 * Funcionalidades:
 * - Criar usuários programaticamente (sem login)
 * - Deletar usuários de forma administrativa
 * - Gerenciar contas com privilégios elevados
 * - Operações que bypassam regras de segurança client-side
 *
 * ⚠️ IMPORTANTE:
 * - Usar apenas em API Routes ou Server Components
 * - Nunca expor essas funções diretamente ao cliente
 * - Implementar autorização adequada antes de usar
 *
 * Casos de uso:
 * - Criação em lote de usuários
 * - Moderação/remoção de contas
 * - Operações administrativas automáticas
 * - Sistemas de onboarding corporativo
 */

import admin from 'firebase-admin'

// ====================================================================
// 📋 INTERFACES DE TIPOS
// ====================================================================

/**
 * Resultado da criação de usuário via Admin SDK
 */
interface CreateUserResult {
  uid: string | null // UID do usuário criado ou null se falhou
  error: string | null // Mensagem de erro ou null se sucesso
}

/**
 * Resultado da exclusão de usuário via Admin SDK
 */
interface DeleteUserResult {
  error: string | null // Mensagem de erro ou null se sucesso
}

// ====================================================================
// 👥 OPERAÇÕES ADMINISTRATIVAS DE USUÁRIOS
// ====================================================================

/**
 * 📝 Cria usuário usando Firebase Admin SDK
 *
 * DIFERENÇAS do client SDK:
 * - Não requer autenticação prévia
 * - Permite criar usuários sem fazer login
 * - Pode definir propriedades administrativas
 * - Não dispara listeners de auth state
 *
 * CONFIGURAÇÕES APLICADAS:
 * - emailVerified: false (força verificação)
 * - Sem login automático
 * - UID gerado automaticamente
 *
 * @param email - Email do novo usuário
 * @param password - Senha do novo usuário
 * @returns Promise com UID criado ou erro
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Em uma API Route
 * const { uid, error } = await createUserAuthAdmin('user@example.com', 'password123')
 * if (uid) {
 *   // Criar documento no Firestore
 *   await createUserDoc(uid, { email, role: 'user' })
 * }
 * ```
 */
export const createUserAuthAdmin = async (
  email: string,
  password: string,
): Promise<CreateUserResult> => {
  try {
    // 🔥 Cria usuário com privilégios administrativos
    const userRecord = await admin.auth().createUser({
      email,
      password,
      // Caso não seja necessário verificação de email, esta linha pode ser removida
      emailVerified: false, // 📧 Força verificação de email
    })

    return {
      uid: userRecord.uid,
      error: null,
    }
  } catch (error: unknown) {
    // 📊 Log para debugging (apenas servidor)
    console.error('Erro ao criar usuário admin:', error)

    // 🎯 Tratamento específico de erros do Firebase Admin
    let errorMessage = 'Erro ao criar usuário'

    if (typeof error === 'object' && error !== null && 'code' in error) {
      const errorCode = (error as { code: string }).code

      // 📋 Mapeamento de códigos de erro específicos
      switch (errorCode) {
        case 'auth/email-already-exists':
          errorMessage = 'Email já está em uso'
          break
        case 'auth/invalid-email':
          errorMessage = 'Email inválido'
          break
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca (mínimo 6 caracteres)'
          break
        case 'auth/invalid-password':
          errorMessage = 'Senha inválida'
          break
        case 'auth/invalid-display-name':
          errorMessage = 'Nome de exibição inválido'
          break
        case 'auth/invalid-photo-url':
          errorMessage = 'URL da foto inválida'
          break
        default:
          errorMessage = `Erro administrativo: ${errorCode}`
      }
    }

    return {
      uid: null,
      error: errorMessage,
    }
  }
}

/**
 * 🗑️ Deleta usuário usando Firebase Admin SDK
 *
 * VANTAGENS do Admin SDK:
 * - Pode deletar qualquer usuário
 * - Não requer que o usuário esteja logado
 * - Bypassa proteções client-side
 * - Ideal para moderação administrativa
 *
 * ⚠️ CUIDADOS:
 * - Operação irreversível
 * - Só remove da autenticação (não do Firestore)
 * - Implementar autorização rigorosa
 * - Considerar soft delete como alternativa
 *
 * @param id - UID do usuário a ser deletado
 * @returns Promise com resultado da operação
 *
 * FLUXO RECOMENDADO:
 * ```typescript
 * // 1. Verificar autorização
 * if (!isAdmin(currentUser)) throw new Error('Não autorizado')
 *
 * // 2. Deletar dados do Firestore primeiro
 * await deleteUserDoc(userId)
 *
 * // 3. Deletar conta de autenticação
 * const { error } = await deleteUserAuthAdmin(userId)
 * ```
 */
export const deleteUserAuthAdmin = async (
  id: string,
): Promise<DeleteUserResult> => {
  try {
    // 🔥 Deleta usuário com privilégios administrativos
    await admin.auth().deleteUser(id)

    return {
      error: null,
    }
  } catch (error: unknown) {
    // 📊 Log para debugging e auditoria
    console.error('Erro ao deletar usuário admin:', error)

    // 🎯 Tratamento específico de erros
    let errorMessage = 'Erro ao deletar usuário'

    if (typeof error === 'object' && error !== null && 'code' in error) {
      const errorCode = (error as { code: string }).code

      // 📋 Mapeamento de códigos de erro específicos
      switch (errorCode) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado'
          break
        case 'auth/invalid-uid':
          errorMessage = 'ID de usuário inválido'
          break
        default:
          errorMessage = `Erro administrativo: ${errorCode}`
      }
    }

    return {
      error: errorMessage,
    }
  }
}
