/**
 * 🔔 HOOK DE TOASTS DA APLICAÇÃO
 *
 * Sistema centralizado de notificações usando react-toastify
 * - Tradução automática de erros Firebase
 * - Configurações padrão consistentes
 * - Tipos específicos de toast (success, error, loading, etc.)
 * - Mensagens de erro personalizadas da aplicação
 */

import { toast, TypeOptions, ToastOptions } from 'react-toastify'

// ====================================================================
// 📋 INTERFACES E TIPOS
// ====================================================================

/**
 * Configuração estendida do toast
 */
interface ToastConfig extends ToastOptions {
  type?: TypeOptions
  autoClose?: number
}

// ====================================================================
// ⚙️ CONFIGURAÇÕES PADRÃO
// ====================================================================

/**
 * Config padrão para todos os toasts
 */
const DEFAULT_CONFIG: ToastConfig = {
  autoClose: 3000, // 3 segundos
  position: 'top-right', // Canto superior direito
  hideProgressBar: false, // Mostra barra de progresso
  closeOnClick: true, // Fecha ao clicar
  pauseOnHover: true, // Pausa ao passar mouse
  draggable: true, // Permite arrastar
}

// ====================================================================
// 🔥 TRADUÇÃO DE ERROS FIREBASE
// ====================================================================

/**
 * Mapeamento de códigos de erro Firebase para mensagens amigáveis
 */
const FIREBASE_AUTH_ERRORS: Record<string, string> = {
  // 🔑 Autenticação
  'auth/user-not-found': 'Usuário não encontrado',
  'auth/wrong-password': 'Senha incorreta',
  'auth/invalid-login-credentials': 'Email ou senha incorretos',
  'auth/invalid-credential': 'Email ou senha incorretos',
  'auth/user-disabled': 'Conta desabilitada. Entre em contato com o suporte',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
  'auth/requires-recent-login':
    'É necessário fazer login novamente para esta ação',

  // 🆕 VARIAÇÕES DO ERRO DE CREDENCIAL INVÁLIDA
  'Firebase: Error (auth/invalid-credential).': 'Email ou senha incorretos',
  'Firebase: Error (auth/invalid-credential)': 'Email ou senha incorretos',
  'Error (auth/invalid-credential).': 'Email ou senha incorretos',
  'Error (auth/invalid-credential)': 'Email ou senha incorretos',
  'auth/invalid-credential.': 'Email ou senha incorretos',
  'invalid-credential': 'Email ou senha incorretos',

  // 📝 Cadastro
  'auth/email-already-in-use': 'Este email já está sendo usado',
  'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres',
  'auth/invalid-email': 'Email inválido',
  'auth/missing-email': 'Email é obrigatório',
  'auth/missing-password': 'Senha é obrigatória',

  // 🪟 Popup/Social
  'auth/cancelled-popup-request': 'Login cancelado',
  'auth/popup-closed-by-user': 'Login cancelado pelo usuário',
  'auth/popup-blocked': 'Popup bloqueado pelo navegador',
  'auth/account-exists-with-different-credential':
    'Conta já existe com método diferente',
  'auth/credential-already-in-use': 'Credencial já está em uso',
  'auth/user-mismatch': 'Usuário não corresponde ao esperado',

  // 📧 Verificação
  'auth/email-not-verified':
    'Email não verificado. Verifique sua caixa de entrada',
  'auth/expired-action-code': 'Código expirado. Solicite um novo',
  'auth/invalid-action-code': 'Código inválido',

  // 🌐 Rede
  'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
  'auth/timeout': 'Tempo limite excedido. Tente novamente',

  // 🆕 OUTROS ERROS COMUNS
  'auth/user-token-expired': 'Sessão expirada. Faça login novamente',
  'auth/invalid-api-key': 'Chave de API inválida',
  'auth/app-deleted': 'Aplicação foi deletada',
  'auth/invalid-user-token': 'Token do usuário inválido',
  'auth/operation-not-allowed': 'Operação não permitida',
  'auth/unauthorized-domain': 'Domínio não autorizado',
  'auth/admin-restricted-operation': 'Operação restrita a administradores',
  'auth/argument-error': 'Argumento inválido fornecido',
  'auth/claims-too-large': 'Claims muito grandes',
  'auth/id-token-expired': 'Token expirado',
  'auth/id-token-revoked': 'Token revogado',
  'auth/insufficient-permission': 'Permissão insuficiente',
  'auth/internal-error': 'Erro interno do servidor',
  'auth/invalid-argument': 'Argumento inválido',
  'auth/invalid-claims': 'Claims inválidos',
  'auth/invalid-continue-uri': 'URL de continuação inválida',
  'auth/invalid-creation-time': 'Tempo de criação inválido',
  'auth/invalid-disabled-field': 'Campo desabilitado inválido',
  'auth/invalid-display-name': 'Nome de exibição inválido',
  'auth/invalid-dynamic-link-domain': 'Domínio do link dinâmico inválido',
  'auth/invalid-email-verified': 'Email verificado inválido',
  'auth/invalid-hash-algorithm': 'Algoritmo de hash inválido',
  'auth/invalid-hash-block-size': 'Tamanho do bloco de hash inválido',
  'auth/invalid-hash-derived-key-length':
    'Comprimento da chave derivada do hash inválido',
  'auth/invalid-hash-key': 'Chave de hash inválida',
  'auth/invalid-hash-memory-cost': 'Custo de memória do hash inválido',
  'auth/invalid-hash-parallelization': 'Paralelização do hash inválida',
  'auth/invalid-hash-rounds': 'Rodadas de hash inválidas',
  'auth/invalid-hash-salt-separator': 'Separador de sal do hash inválido',
  'auth/invalid-id-token': 'Token de ID inválido',
  'auth/invalid-last-sign-in-time': 'Último tempo de login inválido',
  'auth/invalid-page-token': 'Token de página inválido',
  'auth/invalid-password': 'Senha inválida',
  'auth/invalid-password-hash': 'Hash da senha inválido',
  'auth/invalid-password-salt': 'Sal da senha inválido',
  'auth/invalid-phone-number': 'Número de telefone inválido',
  'auth/invalid-photo-url': 'URL da foto inválida',
  'auth/invalid-provider-data': 'Dados do provedor inválidos',
  'auth/invalid-provider-id': 'ID do provedor inválido',
  'auth/invalid-oauth-responsetype': 'Tipo de resposta OAuth inválido',
  'auth/invalid-session-cookie-duration':
    'Duração do cookie de sessão inválida',
  'auth/invalid-uid': 'UID inválido',
  'auth/invalid-user-import': 'Importação de usuário inválida',
  'auth/invalid-provider-uid': 'UID do provedor inválido',
  'auth/missing-android-pkg-name': 'Nome do pacote Android ausente',
  'auth/missing-continue-uri': 'URL de continuação ausente',
  'auth/missing-hash-algorithm': 'Algoritmo de hash ausente',
  'auth/missing-ios-bundle-id': 'ID do bundle iOS ausente',
  'auth/missing-uid': 'UID ausente',
  'auth/missing-oauth-client-secret': 'Segredo do cliente OAuth ausente',
  'auth/phone-number-already-exists': 'Número de telefone já existe',
  'auth/project-not-found': 'Projeto não encontrado',
  'auth/reserved-claims': 'Claims reservados',
  'auth/session-cookie-expired': 'Cookie de sessão expirado',
  'auth/session-cookie-revoked': 'Cookie de sessão revogado',
  'auth/uid-already-exists': 'UID já existe',
  'auth/unauthorized-continue-uri': 'URL de continuação não autorizada',
  'auth/user-not-disabled': 'Usuário não está desabilitado',
}

/**
 * Erros específicos da aplicação
 */
const APP_ERRORS: Record<string, string> = {
  'verify-email': 'Você precisa verificar seu email antes de continuar',
  'non-authenticated-user':
    'Você precisa estar logado para acessar esta funcionalidade',
  loading: 'Aguarde o carregamento finalizar',
  'accept-cookies': 'Aceite os cookies para continuar',
  'invalid-report': 'Relatório inválido gerado',
  'same-inputs': 'Você já gerou um relatório com esses dados',
  'already-saved-report': 'Relatório já foi salvo',
  'enter-before-generate': 'Preencha os campos obrigatórios',
  'recover-user-not-found': 'Se o email existir, você receberá as instruções',
  'Por favor verifique seu email':
    'Você precisa verificar seu email antes de continuar',
}

// ====================================================================
// 🚨 TOAST DE ERRO
// ====================================================================

/**
 * Mostra toast de erro com tradução automática MELHORADA
 * - Traduz erros Firebase automaticamente
 * - Limpa mensagens de erro complexas
 * - Fallback para mensagem original
 * - Log de debug em desenvolvimento
 */
export const errorToast = (
  message: string | null,
  customConfig?: ToastConfig,
) => {
  if (!message) return

  const config: ToastConfig = {
    ...DEFAULT_CONFIG,
    type: 'error',
    ...customConfig,
  }

  // 🔍 Busca tradução diretamente antes de limpar
  const translatedMessage =
    FIREBASE_AUTH_ERRORS[message] || // Mensagem original
    FIREBASE_AUTH_ERRORS[message.replace(/\.$/, '')] || // Sem ponto final
    APP_ERRORS[message] || // Erros da aplicação
    // 🧹 Limpar e normalizar a mensagem de erro
    (() => {
      let cleanMessage = message

      // Log para verificar a mensagem original
      console.debug('Mensagem original:', message)

      // Remover prefixo "Erro: "
      if (cleanMessage.startsWith('Erro: ')) {
        cleanMessage = cleanMessage.replace('Erro: ', '')
      }

      if (cleanMessage.includes('Firebase: Error (')) {
        cleanMessage = cleanMessage
          .replace('Firebase: Error (', '')
          .replace(').', '')
          .replace(')', '')
      }

      if (cleanMessage.includes('Error (')) {
        cleanMessage = cleanMessage
          .replace('Error (', '')
          .replace(')', '')
          .replace('.', '')
      }

      if (cleanMessage.startsWith('Firebase: ')) {
        cleanMessage = cleanMessage.replace('Firebase: ', '')
      }

      // Log para verificar a mensagem limpa
      console.debug('Mensagem limpa:', cleanMessage)

      // Verificar se é um código de erro conhecido (começa com "auth/")
      const isKnownErrorCode = cleanMessage.startsWith('auth/')

      return (
        FIREBASE_AUTH_ERRORS[cleanMessage] || // Mensagem limpa
        FIREBASE_AUTH_ERRORS[cleanMessage + '.'] || // Com ponto final
        APP_ERRORS[cleanMessage] || // Erros da aplicação limpos
        // Se for um código de erro conhecido mas não mapeado, usar fallback
        // Caso contrário, usar a mensagem original (mensagem personalizada)
        (isKnownErrorCode ? 'Erro desconhecido' : message)
      )
    })()

  toast.error(translatedMessage, config)

  // 🐛 Log para debug (apenas dev)
  if (process.env.NODE_ENV === 'development') {
    console.error('🔔 Toast Error Debug:', {
      originalMessage: message,
      translatedMessage,
      foundMapping: !!(
        FIREBASE_AUTH_ERRORS[message] ||
        FIREBASE_AUTH_ERRORS[message.replace(/\.$/, '')]
      ),
    })
  }
}
// ====================================================================
// ✅ TOASTS DE SUCESSO E INFO
// ====================================================================

/**
 * Toast de sucesso
 */
export const successToast = (message: string, customConfig?: ToastConfig) => {
  if (!message) return

  const config: ToastConfig = {
    ...DEFAULT_CONFIG,
    type: 'success',
    ...customConfig,
  }

  toast.success(message, config)
}

/**
 * Toast de informação
 */
export const infoToast = (message: string, customConfig?: ToastConfig) => {
  if (!message) return

  const config: ToastConfig = {
    ...DEFAULT_CONFIG,
    type: 'info',
    ...customConfig,
  }

  toast.info(message, config)
}

/**
 * Toast de aviso/warning
 */
export const warningToast = (message: string, customConfig?: ToastConfig) => {
  if (!message) return

  const config: ToastConfig = {
    ...DEFAULT_CONFIG,
    type: 'warning',
    ...customConfig,
  }

  toast.warning(message, config)
}

// ====================================================================
// ⏳ TOASTS ESPECIAIS
// ====================================================================

/**
 * Toast de loading (não se fecha automaticamente)
 * Retorna ID para atualizar depois
 */
export const loadingToast = (message: string = 'Carregando...') => {
  return toast.loading(message, {
    ...DEFAULT_CONFIG,
    autoClose: false,
  })
}

/**
 * Atualiza toast de loading para sucesso/erro
 */
export const updateLoadingToast = (
  toastId: ReturnType<typeof loadingToast>,
  message: string,
  type: 'success' | 'error' | 'info' = 'success',
) => {
  const config: ToastConfig = {
    ...DEFAULT_CONFIG,
    type,
    autoClose: 3000,
    isLoading: false,
  }

  toast.update(toastId, {
    render: message,
    ...config,
  })
}

/**
 * Toast com barra de progresso personalizada
 */
export const progressToast = (message: string, progress: number) => {
  return toast.info(message, {
    ...DEFAULT_CONFIG,
    progress,
    autoClose: false,
  })
}

/**
 * Remove todos os toasts da tela
 */
export const dismissAllToasts = () => {
  toast.dismiss()
}

// ====================================================================
// 🪝 HOOK PRINCIPAL
// ====================================================================

/**
 * Hook completo com todas as funções de toast
 *
 * Uso:
 * ```typescript
 * const toast = useAppToast()
 * toast.success('Sucesso!')
 * toast.error('Erro!')
 *
 * const loadingId = toast.loading('Salvando...')
 * toast.updateLoading(loadingId, 'Salvo!', 'success')
 * ```
 */
export const useAppToast = () => {
  return {
    error: errorToast,
    success: successToast,
    info: infoToast,
    warning: warningToast,
    loading: loadingToast,
    updateLoading: updateLoadingToast,
    progress: progressToast,
    dismissAll: dismissAllToasts,
  }
}

// ====================================================================
// 📤 EXPORTS ADICIONAIS
// ====================================================================

/**
 * Export alternativo para compatibilidade
 */
export { errorToast as genericErrorToast }

/**
 * Configurações pré-definidas para contextos específicos
 */
export const authToastConfig: ToastConfig = {
  autoClose: 4000,
  position: 'top-center',
}

export const uploadToastConfig: ToastConfig = {
  autoClose: 5000,
  hideProgressBar: false,
}

export const quickToastConfig: ToastConfig = {
  autoClose: 1500,
}
