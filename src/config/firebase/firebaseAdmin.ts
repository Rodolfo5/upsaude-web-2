/**
 * 🔥 CONFIGURAÇÃO DO FIREBASE ADMIN SDK
 *
 * Este arquivo é responsável por:
 * - Configurar o Firebase Admin SDK para uso no servidor
 * - Gerenciar credenciais de service account
 * - Fornecer instâncias administrativas dos serviços Firebase
 * - Validar variáveis de ambiente específicas do Admin
 *
 * ⚠️ IMPORTANTE:
 * - Este arquivo APENAS roda no servidor (Node.js)
 * - Nunca deve ser usado no cliente (browser)
 * - Tem privilégios administrativos completos
 */

import 'server-only' // 🛡️ Garante que este código só roda no servidor
import admin from 'firebase-admin'

// ====================================================================
// 📋 INTERFACES E TIPOS
// ====================================================================

/**
 * Parâmetros necessários para inicializar o Firebase Admin
 */
interface FirebaseAdminAppParams {
  projectId: string // ID do projeto Firebase
  clientEmail: string // Email do service account
  storageBucket: string // Bucket do Storage
  privateKey: string // Chave privada do service account
}

// ====================================================================
// 🔧 FUNÇÕES UTILITÁRIAS
// ====================================================================

/**
 * Formata a chave privada do service account
 *
 * PROBLEMA: Variáveis de ambiente transformam \n em \\n
 * SOLUÇÃO: Converte \\n de volta para quebras de linha reais
 *
 * @param key - Chave privada com \\n
 * @returns Chave privada com quebras de linha corretas
 */
function formatPrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n')
}

// ====================================================================
// 🚀 INICIALIZAÇÃO DO FIREBASE ADMIN
// ====================================================================

/**
 * Cria e configura uma instância do Firebase Admin
 *
 * PADRÃO SINGLETON: Reutiliza a instância se já existir
 *
 * @param params - Parâmetros de configuração
 * @returns Instância do Firebase Admin App
 */
export function createFirebaseAdminApp(
  params: FirebaseAdminAppParams,
): admin.app.App {
  const privateKey = formatPrivateKey(params.privateKey)

  // 🔄 Retorna a app existente se já foi inicializada
  // Evita erro de "app already exists"
  if (admin.apps.length > 0) {
    return admin.app()
  }

  // 🔐 Cria credencial usando service account
  const cert = admin.credential.cert({
    projectId: params.projectId,
    clientEmail: params.clientEmail,
    privateKey,
  })

  // 🚀 Inicializa o Admin SDK
  return admin.initializeApp({
    credential: cert,
    projectId: params.projectId,
    storageBucket: params.storageBucket,
  })
}

/**
 * Inicializa o Firebase Admin com validação de ambiente
 *
 * VALIDAÇÕES:
 * - Verifica se todas as env vars estão presentes
 * - Formata mensagens de erro claras
 * - Retorna instância configurada
 *
 * @returns Promise da instância Firebase Admin
 * @throws Error se variáveis de ambiente estiverem faltando
 */
export async function initAdmin(): Promise<admin.app.App> {
  // 📋 Mapeamento das variáveis de ambiente necessárias
  const requiredEnvVars = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL, // 🔒 Não é NEXT_PUBLIC (servidor only)
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY, // 🔒 Não é NEXT_PUBLIC (servidor only)
  }

  // 🔍 Verifica variáveis faltando
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => `FIREBASE_${key.toUpperCase()}`)

  // 🚨 Para execução se alguma variável estiver faltando
  if (missingVars.length > 0) {
    throw new Error(
      `🚨 Variáveis de ambiente Firebase Admin faltando: ${missingVars.join(', ')}\n` +
        `💡 Adicione essas variáveis no seu arquivo .env.local (server-side only)\n` +
        `📖 Obtenha essas credenciais no Console Firebase > Project Settings > Service Accounts`,
    )
  }

  // ✅ Cria e retorna a instância configurada
  return createFirebaseAdminApp({
    projectId: requiredEnvVars.projectId!,
    clientEmail: requiredEnvVars.clientEmail!,
    storageBucket: requiredEnvVars.storageBucket!,
    privateKey: requiredEnvVars.privateKey!,
  })
}

// ====================================================================
// 📦 INSTÂNCIAS E EXPORTS
// ====================================================================

/**
 * Cache da instância do Admin App
 * Evita reinicialização desnecessária
 */
let adminApp: admin.app.App | null = null

/**
 * Obtém a instância do Firebase Admin (lazy initialization)
 *
 * PADRÃO LAZY: Só inicializa quando realmente precisar
 *
 * @returns Promise da instância Firebase Admin
 */
export const getAdminApp = async (): Promise<admin.app.App> => {
  if (!adminApp) {
    adminApp = await initAdmin()
  }
  return adminApp
}

/**
 * 🔐 SERVIÇO DE AUTENTICAÇÃO ADMIN
 *
 * Permite:
 * - Criar/deletar usuários
 * - Verificar tokens
 * - Gerenciar claims customizados
 * - Redefinir senhas
 *
 * Uso: const auth = adminAuth()
 */
export const adminAuth = (): admin.auth.Auth => admin.auth()

/**
 * 🗄️ SERVIÇO DE FIRESTORE ADMIN
 *
 * Permite:
 * - Ler/escrever sem regras de segurança
 * - Operações em lote
 * - Queries administrativas
 * - Backup/restore
 *
 * Uso: const db = adminFirestore()
 */
export const adminFirestore = (): admin.firestore.Firestore => admin.firestore()

/**
 * 📁 SERVIÇO DE STORAGE ADMIN
 *
 * Permite:
 * - Upload/download sem autenticação
 * - Gerenciar permissões de arquivos
 * - Operações de bucket
 * - Limpeza automática
 *
 * Uso: const storage = adminStorage()
 */
export const adminStorage = (): admin.storage.Storage => admin.storage()

export const verifyIdToken = async (token: string) => {
  try {
    return await admin.auth().verifyIdToken(token)
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}
