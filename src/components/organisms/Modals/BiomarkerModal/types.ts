import { BiomarkerEntity } from '@/types/entities/biomarker'

export interface BiomarkerModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  biomarker?: BiomarkerEntity | null
  onSuccess?: () => void
}
