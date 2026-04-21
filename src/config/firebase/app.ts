/* eslint-disable prettier/prettier */
import { getApp, getApps, initializeApp } from 'firebase/app'

// ====================================================================
// 📋 VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE
// ====================================================================

const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGIN_SENDER_ID, // MESSAGIN = typo legado
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Opcional
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
// 🚀 INICIALIZAÇÃO DO FIREBASE APP
// ====================================================================

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey ?? '',
  authDomain: requiredEnvVars.authDomain ?? '',
  projectId: requiredEnvVars.projectId ?? '',
  storageBucket: requiredEnvVars.storageBucket ?? '',
  messagingSenderId: requiredEnvVars.messagingSenderId ?? '',
  appId: requiredEnvVars.appId ?? '',
  measurementId: requiredEnvVars.measurementId,
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export { app }
export default app
