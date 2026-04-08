/* eslint-disable prettier/prettier */
/**
 * 🔥 CONFIGURAÇÃO PRINCIPAL DO FIREBASE
 *
 * Este arquivo é responsável por:
 * - Inicializar a conexão com o Firebase
 * - Configurar todos os serviços (Auth, Firestore, Storage, Analytics)
 * - Validar variáveis de ambiente obrigatórias
 * - Exportar instâncias prontas para uso
 *
 * IMPORTANTE: Este arquivo roda tanto no servidor quanto no cliente
 */

import { getAnalytics, Analytics } from 'firebase/analytics'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// ====================================================================
// 📋 VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE
// ====================================================================

/**
 * Mapeamento das variáveis de ambiente do Firebase
 * Todas essas devem estar no .env.local (e na Vercel: Project Settings > Environment Variables)
 * measurementId é opcional.
 * Nome correto: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID (aceita também MESSAGIN por compatibilidade).
 */
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGIN_SENDER_ID, // MESSAGIN = typo legado
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Opcional - para Analytics
}

const envVarNames: Record<string, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  measurementId: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
}

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value && key !== 'measurementId')
  .map(([key]) => envVarNames[key] ?? key)

const firebaseEnvErrorMessage =
  missingVars.length > 0
    ? `🚨 Variáveis de ambiente Firebase faltando: ${missingVars.join(', ')}\n` +
      `💡 Local: .env.local. Vercel: Project Settings > Environment Variables (faça novo deploy após adicionar).`
    : null

export const firebaseEnv = {
  isConfigured: missingVars.length === 0,
  missingVars,
  errorMessage: firebaseEnvErrorMessage,
}

if (firebaseEnvErrorMessage && process.env.NODE_ENV === 'production') {
  throw new Error(firebaseEnvErrorMessage)
}

if (firebaseEnvErrorMessage && process.env.NODE_ENV !== 'production') {
  console.warn(firebaseEnvErrorMessage)
}

// ====================================================================
// ⚙️ CONFIGURAÇÃO DO FIREBASE
// ====================================================================

/**
 * Objeto de configuração do Firebase
 * Usa as variáveis de ambiente validadas acima
 */
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey ?? '',
  authDomain: requiredEnvVars.authDomain ?? '',
  projectId: requiredEnvVars.projectId ?? '',
  storageBucket: requiredEnvVars.storageBucket ?? '',
  messagingSenderId: requiredEnvVars.messagingSenderId ?? '',
  appId: requiredEnvVars.appId ?? '',
  measurementId: requiredEnvVars.measurementId,
}

// ====================================================================
// 🚀 INICIALIZAÇÃO DOS SERVIÇOS FIREBASE
// ====================================================================

/**
 * Inicializa a aplicação Firebase
 * Esta é a instância principal que conecta com o projeto
 */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

/**
 * 🔐 AUTHENTICATION SERVICE
 * Gerencia login, logout, cadastro, recuperação de senha
 *
 * Uso: import { auth } from '@/config/firebase/firebase'
 */
export const auth = firebaseEnv.isConfigured ? getAuth(app) : (null as never)

/**
 * 🗄️ FIRESTORE DATABASE SERVICE
 * Banco de dados NoSQL para armazenar documentos
 *
 * Uso: import { firestore } from '@/config/firebase/firebase'
 */
export const firestore = firebaseEnv.isConfigured
  ? getFirestore(app)
  : (null as never)

/**
 * 📁 STORAGE SERVICE
 * Armazenamento de arquivos (imagens, documentos, etc.)
 *
 * Uso: import { storage } from '@/config/firebase/firebase'
 */
export const storage = firebaseEnv.isConfigured
  ? getStorage(app)
  : (null as never)

/**
 * 📊 ANALYTICS SERVICE
 * Coleta dados de uso da aplicação (apenas no cliente)
 *
 * IMPORTANTE: Analytics só funciona no browser, não no servidor
 * Por isso verificamos se estamos no cliente antes de inicializar
 */
let analytics: Analytics | null = null
if (typeof window !== 'undefined' && requiredEnvVars.measurementId) {
  analytics = getAnalytics(app)
}

export { analytics }

/**
 * 📦 EXPORT PADRÃO
 * Exporta a instância principal do Firebase
 *
 * Uso: import firebaseApp from '@/config/firebase/firebase'
 */
export default app
