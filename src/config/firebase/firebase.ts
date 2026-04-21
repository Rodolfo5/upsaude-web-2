/* eslint-disable prettier/prettier */
/**
 * 🔥 CONFIGURAÇÃO PRINCIPAL DO FIREBASE
 *
 * Re-exports auth, firestore, storage, analytics on top of the lean app.ts.
 * Service files that only need the Firebase app instance should import from
 * '@/config/firebase/app' to avoid pulling in all SDK subpackages.
 */

import { getAnalytics, Analytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

import { app, firebaseEnv } from './app'

export { app as default, firebaseEnv }

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
// Only initialize Analytics in production to avoid loading the gtag script
// during development (adblockers/extensions can cause net::ERR_BLOCKED_BY_CLIENT).
if (
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID &&
  process.env.NODE_ENV === 'production'
) {
  analytics = getAnalytics(app)
}

export { analytics }
