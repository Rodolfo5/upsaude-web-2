import type { HealthCheckupEntity } from '@/types/entities/healthCheckup'

type CheckupLike = Partial<HealthCheckupEntity> & Record<string, unknown>

const COMPLETED_STATUS_VALUES = new Set(['COMPLETED', 'COMPLETE', 'REALIZADO'])

function normalizeStatus(status?: unknown): string | null {
  if (typeof status !== 'string') return null
  const normalized = status.trim().toUpperCase()
  return normalized.length ? normalized : null
}

export function isCheckupCompleted(checkup: CheckupLike | null | undefined) {
  if (!checkup) return false

  const status = normalizeStatus(checkup.status)
  if (status && COMPLETED_STATUS_VALUES.has(status)) return true

  if (checkup.completedAt) return true

  if (checkup.healthCheckupCompleted === true) return true

  return false
}
