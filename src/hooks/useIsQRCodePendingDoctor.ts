/**
 * Hook que indica se o usuário logado é médico cadastrado via QR code
 * com status PENDING (aguardando aprovação).
 * Use para bloquear funcionalidades até a aprovação do admin.
 */

import useUser from '@/hooks/useUser'
import { getQRCodePendingDoctorStatus } from '@/services/qrCodeDoctor'
import type { QRCodePendingDoctorResult } from '@/services/qrCodeDoctor'

export function useIsQRCodePendingDoctor(): QRCodePendingDoctorResult & {
  /** true enquanto os dados do usuário ainda estão carregando */
  isLoading: boolean
} {
  const { currentUser, loading } = useUser()
  const isLoading = loading.fetchCurrentUser ?? false
  const status = getQRCodePendingDoctorStatus(currentUser)

  return {
    ...status,
    isLoading,
  }
}
