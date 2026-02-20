import useUser from '@/hooks/useUser'
import { DoctorEntity, UserRole } from '@/types/entities/user'

/**
 * Hook para acessar dados do médico logado
 *
 * Retorna o currentUser tipado como DoctorEntity quando o usuário é um médico,
 * ou null caso contrário.
 *
 * @example
 * ```tsx
 * const { currentDoctor, isDoctor } = useDoctor()
 *
 * if (isDoctor && currentDoctor) {
 *   console.log(currentDoctor.specialty)
 * }
 * ```
 */
export default function useDoctor() {
  const { currentUser } = useUser()

  // Verificar se o usuário é um médico
  const isDoctor = currentUser?.role === UserRole.DOCTOR

  // Retornar tipado como DoctorEntity se for médico, senão null
  const currentDoctor: DoctorEntity | null = isDoctor
    ? (currentUser as DoctorEntity)
    : null

  return {
    currentDoctor,
    isDoctor,
  }
}
