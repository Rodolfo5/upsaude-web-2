/**
 * ⚙️ CONFIGURAÇÃO DO REACT QUERY
 *
 * Configurações centralizadas do QueryClient e persistência
 * - Cache de 5 dias para queries
 * - Persistência no localStorage
 * - Configurações otimizadas para performance
 * - SSR-safe (Next.js)
 */

'use client'

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient } from '@tanstack/react-query'

// ====================================================================
// ⏰ CONFIGURAÇÕES DE TEMPO
// ====================================================================

/**
 * Tempo de cache: 5 dias (renomeado para gcTime no v5)
 * Dados ficam armazenados na memória por este período
 */
const gcTime = 1000 * 60 * 60 * 24 * 5 // 5 dias em millisegundos

/**
 * Tempo que dados são considerados "frescos"
 * Evita refetch desnecessário quando dados ainda são válidos
 */
const staleTime = 1000 * 60 * 30 // 30 minutos

// ====================================================================
// 🔧 QUERY CLIENT
// ====================================================================

/**
 * Cliente principal do React Query
 *
 * Configurações aplicadas:
 * - gcTime: 5 dias (garbage collection time - substitui cacheTime)
 * - staleTime: 30 minutos (tempo considerado "fresco")
 * - retry: 1 tentativa em caso de erro
 * - refetchOnWindowFocus: false (não refaz ao focar janela)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime, // ✅ gcTime substitui cacheTime no v5
      staleTime,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      gcTime, // ✅ Também para mutations
    },
  },
})

// ====================================================================
// 💾 PERSISTÊNCIA DE CACHE
// ====================================================================

/**
 * Persister para localStorage
 *
 * Funcionalidades:
 * - Salva cache no localStorage do navegador
 * - Recupera dados entre sessões/recarregamentos
 * - SSR-safe (verifica se window existe)
 * - Serialização automática JSON
 */
export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  serialize: JSON.stringify, // Como salvar os dados
  deserialize: JSON.parse, // Como recuperar os dados
})

// ====================================================================
// 🛠️ UTILITÁRIOS PARA CACHE
// ====================================================================

/**
 * Limpa todo o cache do React Query
 * Útil para logout ou reset de dados
 */
export const clearQueryCache = () => {
  queryClient.clear()
}

/**
 * Invalida queries específicas por chave
 * Força nova busca dos dados
 */
export const invalidateQueries = (queryKey: string[]) => {
  return queryClient.invalidateQueries({ queryKey })
}

/**
 * Remove query específica do cache
 * Apaga dados específicos da memória
 */
export const removeQuery = (queryKey: string[]) => {
  queryClient.removeQueries({ queryKey })
}

// ====================================================================
// 🎯 QUERY KEYS CENTRALIZADAS
// ====================================================================

/**
 * Chaves de queries padronizadas
 * Evita inconsistências e typos nas chaves
 *
 * Uso:
 * ```typescript
 * useQuery({
 *   queryKey: QUERY_KEYS.users.all,
 *   queryFn: fetchUsers
 * })
 * ```
 */
export const QUERY_KEYS = {
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    current: ['users', 'current'] as const,
  },
  auth: {
    user: ['auth', 'user'] as const,
  },
  // 📝 Adicione mais conforme necessário
} as const
