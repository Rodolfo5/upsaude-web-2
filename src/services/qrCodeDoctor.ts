/**
 * Serviço para identificar médico que se cadastrou via QR code do prontuário
 * e ainda está com status PENDING (aguardando aprovação do admin).
 * Usado para bloquear funcionalidades até a aprovação.
 */

import type { DoctorEntity, UserEntity } from '@/types/entities/user'
import { UserStatus } from '@/types/entities/user'

export interface QRCodePendingDoctorResult {
  /** true se o usuário tem qrCodePatientId e status === PENDING */
  isQRCodePendingDoctor: boolean
  /** ID do paciente do prontuário compartilhado (quando aplicável) */
  qrCodePatientId: string | null
}

/**
 * Verifica se o usuário é médico cadastrado via QR code com status PENDING.
 * Útil para restringir funcionalidades (ex.: só permitir ver o prontuário daquele paciente).
 */
export function getQRCodePendingDoctorStatus(
  user: UserEntity | null,
): QRCodePendingDoctorResult {
  if (!user) {
    return { isQRCodePendingDoctor: false, qrCodePatientId: null }
  }

  const doctor = user as DoctorEntity
  const hasQRCodePatientId = Boolean(doctor?.qrCodePatientId?.trim())
  const isPending = doctor?.status === UserStatus.PENDING

  const isQRCodePendingDoctor = hasQRCodePatientId && isPending
  const qrCodePatientId = isQRCodePendingDoctor
    ? (doctor.qrCodePatientId ?? null)
    : null

  return {
    isQRCodePendingDoctor,
    qrCodePatientId,
  }
}
