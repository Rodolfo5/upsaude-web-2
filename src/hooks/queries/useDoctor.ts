import { useMemo } from 'react'

import { useFindDoctorById } from './useFindDoctorById'

export function useDoctor(doctorId?: string | null) {
  const id = doctorId ?? ''
  const { data, isLoading, isError } = useFindDoctorById(id)

  const result = useMemo(() => {
    return {
      name: data?.name ?? null,
      specialty: data?.specialty ?? null,
      isLoading,
      isError,
    }
  }, [data, isLoading, isError])

  return result
}
