/**
 * 🔐 TIPOS DO CONTEXTO DE AUTENTICAÇÃO
 *
 * Define interface TypeScript para AuthContext
 * - Type safety em toda aplicação
 * - Contratos entre Provider e Consumer
 * - IntelliSense para desenvolvimento
 */

'use client'

import { Dispatch, SetStateAction } from 'react'
import { z } from 'zod'

import SignUpForm from '@/validations/signUp'

// ====================================================================
// 📋 TIPOS DERIVADOS
// ====================================================================

/**
 * Tipo do formulário de cadastro sem confirmPassword
 */
type SignUpFormValidationData = z.infer<typeof SignUpForm>

// ====================================================================
// 🎯 INTERFACE PRINCIPAL
// ====================================================================

export interface AuthContextType {
  // ====================================================================
  // 📊 ESTADO
  // ====================================================================

  /**
   * UID do usuário logado (string vazia = não logado)
   *
   * Uso: !!userUid para verificar se está logado
   */
  userUid: string

  /**
   * Estados de loading por operação
   *
   * Ex: loading.loginWithInternalService, loading.deleteUser
   */
  loading: Record<string, boolean>

  /**
   * Setter direto do UID (uso interno do Provider)
   */
  setUserUid: Dispatch<SetStateAction<string>>

  // ====================================================================
  // 🔧 OPERAÇÕES
  // ====================================================================

  /**
   * Aguarda sincronização do estado de auth
   */
  waitForUserSync: () => Promise<void>

  /**
   * Login com email/senha
   * Verifica email verificado automaticamente
   */
  loginWithInternalService: (email: string, password: string) => void

  /**
   * Login com Google
   * Abre popup do Google e gerencia criação/login de usuário
   */
  loginWithGoogle: () => Promise<void>

  /**
   * Login com Apple
   * Abre popup da Apple e gerencia criação/login de usuário
   */
  loginWithApple: () => Promise<void>

  /**
   * Cadastro de novo usuário
   * Cria conta + documento Firestore + envia verificação
   */
  createUserWithInternalService: ({
    email,
    password,
    name,
  }: Omit<SignUpFormValidationData, 'confirmPassword'>) => Promise<void>

  /**
   * Envia email de recuperação de senha
   * Sempre mostra sucesso por segurança
   */
  forgotPassword: (email: string) => void

  /**
   * Logout completo
   * Limpa estado + redireciona
   */
  logoutUser: () => void

  /**
   * Deleta conta atual (IRREVERSÍVEL)
   * Remove Firestore + Auth + limpa estado
   */
  deleteUser: () => void
}
