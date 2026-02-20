/**
 * 🔄 PROVIDER DE REACT QUERY
 *
 * Wrapper para configurar React Query com persistência de cache
 * - Cache persistente entre sessões
 * - Configurações otimizadas para performance
 * - Provider principal para toda aplicação
 */

'use client'

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ReactNode } from 'react'

import { queryClient, persister } from './queryClient'

// ====================================================================
// 📋 TIPOS
// ====================================================================

interface Props {
  children: ReactNode
}

// ====================================================================
// 🚀 COMPONENTE PROVIDER
// ====================================================================

/**
 * Provider principal do React Query com persistência
 *
 * Funcionalidades:
 * - Cache persistente no localStorage/sessionStorage
 * - Configurações globais de queries
 * - Hydratação automática do cache
 *
 * Setup no app:
 * ```typescript
 * <QueryClientProviderApp>
 *   <App />
 * </QueryClientProviderApp>
 * ```
 */
export default function QueryClientProviderApp({ children }: Props) {
  // 📝 Comentário sobre QueryClient inline comentado:
  // Movido para arquivo separado (queryClient.ts) para reutilização
  // e configurações centralizadas

  return (
    <PersistQueryClientProvider
      client={queryClient} // Cliente configurado externamente
      persistOptions={{ persister }} // Persistência configurada
    >
      {children}
    </PersistQueryClientProvider>
  )
}
