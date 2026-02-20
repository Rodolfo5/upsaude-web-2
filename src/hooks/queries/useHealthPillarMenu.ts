import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createMenu,
  deleteMenu,
  getAllMenusByPillar,
  getMenuById,
  updateMenu,
} from '@/services/healthPillarMenu'
import { MenuEntity } from '@/types/entities/healthPillar'

import { errorToast, successToast } from '../useAppToast'

/**
 * Hook para buscar um cardápio específico por ID
 */
export const useMenu = (
  patientId: string,
  planId: string,
  pillarId: string,
  menuId: string,
) => {
  return useQuery({
    queryKey: ['menu', patientId, planId, pillarId, menuId],
    queryFn: () => getMenuById(patientId, planId, pillarId, menuId),
    enabled:
      !!patientId &&
      !!planId &&
      !!pillarId &&
      !!menuId &&
      planId !== 'new' &&
      menuId !== 'new',
  })
}

/**
 * Hook para buscar todos os cardápios de um pilar
 */
export const useMenusByPillar = (
  patientId: string,
  planId: string,
  pillarId: string,
) => {
  return useQuery({
    queryKey: ['menus-by-pillar', patientId, planId, pillarId],
    queryFn: () => getAllMenusByPillar(patientId, planId, pillarId),
    enabled: !!patientId && !!planId && !!pillarId && planId !== 'new',
  })
}

/**
 * Hook para criar um novo cardápio
 */
export const useCreateMenu = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      data: Partial<MenuEntity>
    }) => {
      return await createMenu(patientId, planId, pillarId, data)
    },
    onSuccess: (_, variables) => {
      successToast('Cardápio criado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'menus-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao criar cardápio')
    },
  })
}

/**
 * Hook para atualizar um cardápio existente
 */
export const useUpdateMenu = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      menuId,
      data,
    }: {
      patientId: string
      planId: string
      pillarId: string
      menuId: string
      data: Partial<MenuEntity>
    }) => {
      return await updateMenu(patientId, planId, pillarId, menuId, data)
    },
    onSuccess: (_, variables) => {
      successToast('Cardápio atualizado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'menus-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'menu',
          variables.patientId,
          variables.planId,
          variables.pillarId,
          variables.menuId,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao atualizar cardápio')
    },
  })
}

/**
 * Hook para deletar um cardápio
 */
export const useDeleteMenu = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      pillarId,
      menuId,
    }: {
      patientId: string
      planId: string
      pillarId: string
      menuId: string
    }) => {
      return await deleteMenu(patientId, planId, pillarId, menuId)
    },
    onSuccess: (_, variables) => {
      successToast('Cardápio removido com sucesso!')
      queryClient.invalidateQueries({
        queryKey: [
          'menus-by-pillar',
          variables.patientId,
          variables.planId,
          variables.pillarId,
        ],
      })
    },
    onError: (error: Error) => {
      errorToast(error.message || 'Erro ao remover cardápio')
    },
  })
}
