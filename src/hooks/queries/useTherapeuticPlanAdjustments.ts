import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryDocumentSnapshot } from 'firebase/firestore'
import { useState } from 'react'

import {
  createAdjustment,
  getAdjustmentsByPatient,
} from '@/services/therapeuticPlanAdjustment'
import { TherapeuticPlanAdjustmentEntity } from '@/types/entities/therapeuticPlanAdjustment'

import { errorToast } from '../useAppToast'

/**
 * Hook para buscar ajustes terapêuticos de um paciente com paginação
 */
export const useAdjustments = (
  patientId: string,
  pageSize: number = 3,
) => {
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [allAdjustments, setAllAdjustments] = useState<
    TherapeuticPlanAdjustmentEntity[]
  >([])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['therapeutic-plan-adjustments', patientId, currentPage],
    queryFn: async () => {
      const result = await getAdjustmentsByPatient(
        patientId,
        pageSize,
        lastDoc || undefined,
      )

      if (currentPage === 0) {
        // Primeira página - substituir todos
        setAllAdjustments(result.adjustments)
      } else {
        // Páginas seguintes - adicionar aos existentes
        setAllAdjustments((prev) => [...prev, ...result.adjustments])
      }

      setLastDoc(result.lastDoc)
      return result
    },
    enabled: !!patientId,
  })

  const goToPage = (page: number) => {
    // Para simplificar, vamos usar uma abordagem client-side
    // Carregando todos os ajustes e paginando no cliente
    setCurrentPage(page)
  }

  const totalPages = Math.ceil(allAdjustments.length / pageSize)
  const currentPageAdjustments = allAdjustments.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  )

  return {
    adjustments: currentPageAdjustments,
    isLoading,
    error,
    currentPage,
    totalPages,
    hasMore: data?.hasMore || false,
    goToPage,
    refetch,
  }
}

/**
 * Hook simplificado para buscar todos os ajustes (para paginação client-side)
 */
export const useAllAdjustments = (patientId: string) => {
  return useQuery({
    queryKey: ['therapeutic-plan-adjustments-all', patientId],
    queryFn: async () => {
      // Buscar todos os ajustes (sem limite)
      let allAdjustments: TherapeuticPlanAdjustmentEntity[] = []
      let lastDoc: QueryDocumentSnapshot | null = null
      let hasMore = true

      while (hasMore) {
        const result = await getAdjustmentsByPatient(patientId, 50, lastDoc || undefined)
        allAdjustments = [...allAdjustments, ...result.adjustments]
        lastDoc = result.lastDoc
        hasMore = result.hasMore
        
        // Limite de segurança para evitar loops infinitos
        if (allAdjustments.length > 1000) {
          break
        }
      }

      return allAdjustments
    },
    enabled: !!patientId,
  })
}

/**
 * Hook para criar um novo ajuste
 */
export const useCreateAdjustment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      planId,
      data,
    }: {
      patientId: string
      planId: string
      data: {
        adjustmentType: string
        title: string
        doctorId: string
        doctorName: string
      }
    }) => {
      return await createAdjustment(patientId, planId, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['therapeutic-plan-adjustments', variables.patientId],
      })
      queryClient.invalidateQueries({
        queryKey: ['therapeutic-plan-adjustments-all', variables.patientId],
      })
    },
    onError: (error: Error) => {
      console.error('Erro ao criar ajuste:', error)
      // Não mostrar toast para não poluir a UI
    },
  })
}
