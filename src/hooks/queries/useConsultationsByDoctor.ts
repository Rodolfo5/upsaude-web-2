import { useMemo } from 'react'

import useAllConsultations from '@/hooks/queries/useAllConsultations'
import useUser from '@/hooks/useUser'
import { ConsultationEntity } from '@/types/entities/consultation'

const useConsultationsByDoctor = (date?: Date) => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id
  const { data: allConsultations, isLoading } = useAllConsultations()

  const filteredConsultations = useMemo(() => {
    if (!allConsultations || !doctorId) {
      return []
    }

    let filtered: ConsultationEntity[] = allConsultations.filter(
      (consultation) => consultation.doctorId === doctorId,
    )

    if (date) {
      const targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      filtered = filtered.filter((consultation) => {
        const consultationDate = new Date(consultation.date)
        consultationDate.setHours(0, 0, 0, 0)
        return consultationDate >= targetDate && consultationDate < nextDay
      })
    }

    return filtered
  }, [allConsultations, doctorId, date])

  return {
    data: filteredConsultations,
    isLoading,
  }
}

export default useConsultationsByDoctor
