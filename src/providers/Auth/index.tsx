/**
 * 🔐 PROVIDER DE AUTENTICAÇÃO
 *
 * Gerencia estado global de autenticação da aplicação
 * - Estado do usuário logado
 * - Operações de auth (login, logout, cadastro, etc.)
 * - Loading states para UI
 * - Verificação automática de email
 */

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

import { errorToast, successToast } from '@/hooks/useAppToast'
import {
  createUserWithEmailAndPasswordLocal,
  deleteOwnAccount,
  logout,
  recoverPassword,
  signInWithApple,
  signInWithEmailAndPasswordLocal,
  signInWithGoogle,
  waitForUser,
} from '@/services/firebase/auth'
import { createNewUserDoc, deleteUserDoc, getUserDoc } from '@/services/user'
import { UserRole } from '@/types/entities/user'
import SignUpForm from '@/validations/signUp'

import AuthContext from './context'

// ====================================================================
// 📋 TIPOS E INTERFACES
// ====================================================================

interface Props {
  children: React.ReactNode
}

type SignUpFormValidationData = z.infer<typeof SignUpForm>

// ====================================================================
// 🚀 COMPONENTE PROVIDER
// ====================================================================

const AuthProvider = ({ children }: Props) => {
  // ====================================================================
  // 📊 ESTADO INICIAL
  // ====================================================================

  /**
   * Estados de loading para cada operação
   */
  const initialLoadingObject = {
    onAuthUserChanged: true, // Carregamento inicial do auth state
    loginWithInternalService: false, // Login em progresso
    createUserWithInternalService: false, // Cadastro em progresso
    forgotPassword: false, // Recuperação de senha
    updatePassword: false, // Atualização de senha
    deleteUser: false, // Exclusão de conta
    logout: false, // Logout em progresso
    loginWithGoogle: false, // Login com Google
    loginWithApple: false, // Login com Apple
  }

  const [userUid, setUserUid] = useState<string>('')
  const [loadingState, setLoading] = useState(initialLoadingObject)
  const router = useRouter()

  const redirectAdminToAdminLogin = async () => {
    await logout()
    setUserUid('')
    errorToast(
      'Administradores devem acessar pela pagina de login administrativo.',
    )
    router.replace('/admin-login')
  }

  const loading = useMemo(
    () => ({
      onAuthUserChanged: loadingState.onAuthUserChanged,
      loginWithInternalService: loadingState.loginWithInternalService,
      createUserWithInternalService: loadingState.createUserWithInternalService,
      forgotPassword: loadingState.forgotPassword,
      updatePassword: loadingState.updatePassword,
      deleteUser: loadingState.deleteUser,
      logout: loadingState.logout,
      loginWithGoogle: loadingState.loginWithGoogle,
      loginWithApple: loadingState.loginWithApple,
    }),
    [
      loadingState.onAuthUserChanged,
      loadingState.loginWithInternalService,
      loadingState.createUserWithInternalService,
      loadingState.forgotPassword,
      loadingState.updatePassword,
      loadingState.deleteUser,
      loadingState.logout,
      loadingState.loginWithGoogle,
      loadingState.loginWithApple,
    ],
  )

  // ====================================================================
  // 🔄 LISTENER DE ESTADO DE AUTH
  // ====================================================================

  /**
   * Monitora mudanças no estado de autenticação
   * - Verifica email verificado automaticamente
   * - Atualiza UID do usuário
   * - Controla loading inicial
   */
  useEffect(() => {
    const unsubscribe = waitForUser((user) => {
      if (user) {
        setUserUid(user.uid)
        sessionStorage.setItem('userUid', user.uid)
      } else {
        setUserUid('')
        sessionStorage.removeItem('userUid')
      }
      setLoading((prev) => ({ ...prev, onAuthUserChanged: false }))
    })

    const storedUserUid = sessionStorage.getItem('userUid')
    if (storedUserUid) {
      setUserUid(storedUserUid)
    }

    return () => unsubscribe()
  }, [])

  // ====================================================================
  // 🔑 OPERAÇÕES DE AUTENTICAÇÃO
  // ====================================================================

  /**
   * Login com email e senha
   * - Valida email verificado
   * - Mostra toasts de feedback
   * - Atualiza estado automaticamente
   * - O router cuida do redirecionamento baseado no estado do usuário
   */
  const loginWithInternalService = async (email: string, password: string) => {
    setLoading((prev) => ({ ...prev, loginWithInternalService: true }))

    const { error, user } = await signInWithEmailAndPasswordLocal(
      email,
      password,
    )

    if (user) {
      const { user: userData } = await getUserDoc(user.uid)

      if (userData?.role === UserRole.ADMIN) {
        await redirectAdminToAdminLogin()
        setLoading((prev) => ({ ...prev, loginWithInternalService: false }))
        return
      }

      successToast('Bem vindo de volta!')
      setUserUid(user.uid)
    } else {
      setUserUid('')
      errorToast(error)
    }

    setLoading((prev) => ({ ...prev, loginWithInternalService: false }))
  }

  /**
   * Cadastro de novo usuário
   * - Cria conta no Auth
   * - Cria documento no Firestore
   * - Envia verificação de email
   * - Redireciona para login
   */
  // Adicione esta versão temporária para debug:
  const createUserWithInternalService = async ({
    email,
    password,
    name,
  }: Omit<SignUpFormValidationData, 'confirmPassword'>) => {
    setLoading((prev) => ({ ...prev, createUserWithInternalService: true }))

    try {
      const authResult = await createUserWithEmailAndPasswordLocal(
        email,
        password,
      )

      if (authResult.error || !authResult.user?.uid) {
        errorToast(authResult.error || 'Erro ao criar autenticação')
        return
      }

      const docResult = await createNewUserDoc({
        uid: authResult.user.uid,
        email,
        name,
        role: UserRole.DOCTOR,
      })

      if (docResult.error) {
        await deleteOwnAccount()
        errorToast('Erro ao criar perfil do usuário')
      } else {
        successToast('Conta criada com sucesso!')
        router.push('/login')
      }
    } catch (error) {
      errorToast('Erro: ' + (error as Error).message)
    } finally {
      setLoading((prev) => ({ ...prev, createUserWithInternalService: false }))
    }
  }

  /**
   * 🌐 Login com Google
   * - Abre popup do Google para autenticação
   * - Verifica se usuário já existe no Firestore
   * - Cria documento inicial se necessário
   * - O router cuida do redirecionamento baseado no estado do usuário
   */
  const handleLoginWithGoogle = async () => {
    setLoading((prev) => ({ ...prev, loginWithGoogle: true }))

    const { error, user } = await signInWithGoogle()

    if (user) {
      // Verificar se usuário já existe no Firestore
      const { user: userData, error: userError } = await getUserDoc(user.uid)

      if (userData?.role === UserRole.ADMIN) {
        await redirectAdminToAdminLogin()
        setLoading((prev) => ({ ...prev, loginWithGoogle: false }))
        return
      }

      // Se não existe no Firestore, criar documento inicial
      if (!userData || userError) {
        await createNewUserDoc({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'Usuário',
          role: UserRole.DOCTOR,
        })
      }

      successToast('Bem vindo!')
      setUserUid(user.uid)
    } else {
      // Não limpar userUid se foi apenas popup fechado
      if (error !== 'popup-closed-by-user') {
        setUserUid('')
        errorToast(error || 'Erro ao fazer login com Google')
      }
    }

    setLoading((prev) => ({ ...prev, loginWithGoogle: false }))
  }

  /**
   * 🍎 Login com Apple
   * - Abre popup da Apple para autenticação
   * - Verifica se usuário já existe no Firestore
   * - Cria documento inicial se necessário
   * - O router cuida do redirecionamento baseado no estado do usuário
   */
  const handleLoginWithApple = async () => {
    setLoading((prev) => ({ ...prev, loginWithApple: true }))

    const { error, user } = await signInWithApple()

    if (user) {
      // Verificar se usuário já existe no Firestore
      const { user: userData, error: userError } = await getUserDoc(user.uid)

      if (userData?.role === UserRole.ADMIN) {
        await redirectAdminToAdminLogin()
        setLoading((prev) => ({ ...prev, loginWithApple: false }))
        return
      }

      // Se não existe no Firestore, criar documento inicial
      if (!userData || userError) {
        await createNewUserDoc({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'Usuário',
          role: UserRole.DOCTOR,
        })
      }

      successToast('Bem vindo!')
      setUserUid(user.uid)
    } else {
      // Não limpar userUid se foi apenas popup fechado
      if (error !== 'popup-closed-by-user') {
        setUserUid('')
        errorToast(error || 'Erro ao fazer login com Apple')
      }
    }

    setLoading((prev) => ({ ...prev, loginWithApple: false }))
  }

  /**
   * Recuperação de senha
   * - Envia email de reset
   * - Sempre mostra sucesso por segurança
   */
  const forgotPassword = async (email: string) => {
    setLoading((prev) => ({ ...prev, forgotPassword: true }))

    const { error } = await recoverPassword(email)

    if (!error) {
      successToast('Email de recuperação enviado')
    } else {
      errorToast(error)
    }

    setLoading((prev) => ({ ...prev, forgotPassword: false }))
  }

  /**
   * Exclusão de conta (IRREVERSÍVEL)
   * - Deleta documento Firestore
   * - Deleta conta Auth
   * - Limpa estado local
   * - Redireciona para home
   */
  const deleteUser = async () => {
    setLoading((prev) => ({ ...prev, deleteUser: true }))

    try {
      // 🗄️ Deletar documento do Firestore primeiro
      const { error: firestoreError } = await deleteUserDoc(userUid)
      if (firestoreError) {
        console.error('Erro ao deletar documento:', firestoreError)
      }

      // 🔐 Deletar conta de autenticação
      const { error: authError } = await deleteOwnAccount()
      if (authError) {
        errorToast(authError)
      } else {
        successToast('Conta deletada com sucesso')
        setUserUid('')
        router.push('/')
      }
    } catch {
      errorToast('Erro ao deletar conta')
    }

    setLoading((prev) => ({ ...prev, deleteUser: false }))
  }

  /**
   * Logout completo
   * - Faz logout no Firebase
   * - Limpa estado local
   * - Redireciona para login (não usado para admin, veja Navbar)
   */
  const logoutUser = async (redirectPath = '/login') => {
    setLoading((prev) => ({ ...prev, logout: true }))

    await logout()
    setUserUid('')
    router.push(redirectPath)

    setLoading((prev) => ({ ...prev, logout: false }))
  }

  /**
   * Sincronização manual do estado
   * - Força verificação do auth state
   * - Útil após operações específicas
   */
  const waitForUserSync = async () => {
    setLoading((prev) => ({ ...prev, onAuthUserChanged: true }))

    await new Promise<void>((resolve) => {
      const unsubscribe = waitForUser((user) => {
        unsubscribe()
        if (user && !user.emailVerified) {
          logout()
          setUserUid('')
        }
        resolve()
      })
    })

    setLoading((prev) => ({ ...prev, onAuthUserChanged: false }))
  }

  // ====================================================================
  // 🎯 PROVIDER RENDER
  // ====================================================================

  return (
    <AuthContext.Provider
      value={{
        userUid,
        loading,
        forgotPassword,
        loginWithInternalService,
        loginWithGoogle: handleLoginWithGoogle,
        loginWithApple: handleLoginWithApple,
        logoutUser,
        setUserUid,
        deleteUser,
        createUserWithInternalService,
        waitForUserSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
