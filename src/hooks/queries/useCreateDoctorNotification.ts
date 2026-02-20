import { useMutation } from '@tanstack/react-query'

import {
  createDoctorNotification,
  CreateDoctorNotificationInput,
} from '@/services/doctorNotification'

export const useCreateDoctorNotification = () => {
  return useMutation({
    mutationFn: (data: CreateDoctorNotificationInput) =>
      createDoctorNotification(data),
  })
}
