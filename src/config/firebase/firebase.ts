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
import { initializeApp } from 'firebase/app'
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

if (missingVars.length > 0) {
  throw new Error(
    `🚨 Variáveis de ambiente Firebase faltando: ${missingVars.join(', ')}\n` +
    `💡 Local: .env.local. Vercel: Project Settings > Environment Variables (faça novo deploy após adicionar).`,
  )
}

// ====================================================================
// ⚙️ CONFIGURAÇÃO DO FIREBASE
// ====================================================================

/**
 * Objeto de configuração do Firebase
 * Usa as variáveis de ambiente validadas acima
 */
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey!, // Chave da API
  authDomain: requiredEnvVars.authDomain!, // Domínio de autenticação
  projectId: requiredEnvVars.projectId!, // ID do projeto
  storageBucket: requiredEnvVars.storageBucket!, // Bucket do Storage
  messagingSenderId: requiredEnvVars.messagingSenderId!, // ID do messaging
  appId: requiredEnvVars.appId!, // ID da aplicação
  measurementId: requiredEnvVars.measurementId, // ID do Analytics (opcional)
}

// ====================================================================
// 🚀 INICIALIZAÇÃO DOS SERVIÇOS FIREBASE
// ====================================================================

/**
 * Inicializa a aplicação Firebase
 * Esta é a instância principal que conecta com o projeto
 */
const app = initializeApp(firebaseConfig)

/**
 * 🔐 AUTHENTICATION SERVICE
 * Gerencia login, logout, cadastro, recuperação de senha
 *
 * Uso: import { auth } from '@/config/firebase/firebase'
 */
export const auth = getAuth(app)

/**
 * 🗄️ FIRESTORE DATABASE SERVICE
 * Banco de dados NoSQL para armazenar documentos
 *
 * Uso: import { firestore } from '@/config/firebase/firebase'
 */
export const firestore = getFirestore(app)

/**
 * 📁 STORAGE SERVICE
 * Armazenamento de arquivos (imagens, documentos, etc.)
 *
 * Uso: import { storage } from '@/config/firebase/firebase'
 */
export const storage = getStorage(app)

/**
 * 📊 ANALYTICS SERVICE
 * Coleta dados de uso da aplicação (apenas no cliente)
 *
 * IMPORTANTE: Analytics só funciona no browser, não no servidor
 * Por isso verificamos se estamos no cliente antes de inicializar
 */
let analytics: Analytics | null = null
if (typeof window !== 'undefined') {
  // Só inicializa se estiver no cliente (browser)
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
