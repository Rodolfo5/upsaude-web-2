/**
 * 👥 TIPOS DO CONTEXTO DE USUÁRIOS
 *
 * Define interface para gerenciamento de dados de usuários
 * - Estado do usuário atual e lista de usuários
 * - Operações CRUD específicas para usuários
 * - Loading states para operações assíncronas
 */

import { UserEntity, UserRole } from '@/types/entities/user'

export interface UserContextType {
  // ====================================================================
  // 📊 ESTADO
  // ====================================================================

  /**
   * Dados do usuário logado atual
   * null = não carregado ou erro
   */
  currentUser: UserEntity | null

  /**
   * Lista de todos os usuários (admin)
   * null = não carregado, [] = carregado vazio
   */
  allUsers: UserEntity[] | null

  /**
   * Estados de loading por operação
   * Ex: loading.fetchCurrentUser, loading.updateUser
   */
  loading: Record<string, boolean>

  // ====================================================================
  // 🔧 OPERAÇÕES
  // ====================================================================

  /**
   * Atualiza dados do usuário atual
   * Aplica mudanças localmente + Firestore
   */
  updateUser: (updates: {
    email?: string
    name?: string
    role?: UserRole
  }) => Promise<void>

  /**
   * Carrega dados do usuário atual
   * Baseado no UID do AuthContext
   */
  fetchCurrentUser: () => Promise<void>

  /**
   * Carrega todos os usuários (admin only)
   * Para dashboards e gerenciamento
   */
  fetchAllUsers: () => Promise<void>

  /**
   * Atualiza role de usuário específico (admin only)
   * Atualiza lista local automaticamente
   */
  updateUserRole: (uid: string, role: UserRole) => Promise<void>

  /**
   * Recarrega dados do usuário atual
   * Força nova busca no Firestore
   */
  refreshUser: () => Promise<void>
}
