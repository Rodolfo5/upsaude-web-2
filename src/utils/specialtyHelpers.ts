import {
  memedGroupToIds,
  specialtyValueToMemedGroup,
} from '@/constants/memedSpecialtiesMap'
import {
  getSpecialtiesForCredential,
  medicalSpecialties,
  specialtiesByCredential,
} from '@/constants/options'

/** Lista plana de todas as especialidades (todas as credenciais) para lookup por value */
const allSpecialtyOptions = (() => {
  const seen = new Set<string>()
  const list: Array<{ value: string; label: string }> = []
  ;[medicalSpecialties, ...Object.values(specialtiesByCredential)].forEach(
    (arr) => {
      arr.forEach((s) => {
        if (!seen.has(s.value)) {
          seen.add(s.value)
          list.push(s)
        }
      })
    },
  )
  return list
})()

/**
 * Retorna todas as especialidades (todas as credenciais) para selects sem contexto de credencial
 * (ex.: solicitar consulta complementar, admin).
 */
export function getAllSpecialties(): Array<{ value: string; label: string }> {
  return [...allSpecialtyOptions]
}

/**
 * Retorna o label de exibição para um value de especialidade.
 * Funciona para valores de qualquer tipo de credencial e para valores legados.
 */
export function getSpecialtyLabel(value: string | undefined): string {
  if (!value) return ''
  const found = allSpecialtyOptions.find((s) => s.value === value)
  if (found) return found.label
  if (value === 'outra') return 'Outra'
  return value
}

/**
 * Retorna o primeiro ID Memed para uma especialidade (grupo) de médico (CRM).
 * Usado ao registrar médico na Memed. Para não-CRM retorna undefined.
 */
export function getMemedIdForSpecialty(
  specialtyValue: string | undefined,
): number | undefined {
  if (!specialtyValue) return undefined
  const group = specialtyValueToMemedGroup[specialtyValue]
  if (!group) return undefined
  const ids = memedGroupToIds[group]
  return ids?.[0]
}

/**
 * Verifica se a especialidade é válida para o tipo de credencial.
 */
export function isValidSpecialtyForCredential(
  specialty: string | undefined,
  credentialType: string | undefined,
): boolean {
  if (!specialty || !credentialType) return false
  const allowed = getSpecialtiesForCredential(credentialType)
  return allowed.some((s) => s.value === specialty)
}

export { getSpecialtiesForCredential }
