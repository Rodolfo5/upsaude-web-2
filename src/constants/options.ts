/** Credenciais que permitem prescrição digital via Memed */
export const MEMED_ALLOWED_CREDENTIALS = ['CRM', 'CRO']

export const credentialTypes = [
  { value: 'CRM', label: 'CRM - Conselho Regional de Medicina' },
  { value: 'CRN', label: 'CRN - Conselho Regional de Nutrição' },
  { value: 'CRO', label: 'CRO - Conselho Regional de Odontologia' },
  { value: 'CRF', label: 'CRF - Conselho Regional de Farmácia' },
  { value: 'CRP', label: 'CRP - Conselho Regional de Psicologia' },
  { value: 'CREFITO', label: 'CREFITO - Conselho Regional de Fisioterapia' },
  { value: 'CREF', label: 'CREF - Conselho Regional de Educação Física' },
]

/** Grupos únicos de especialidades da API Memed (grupo ou nome quando grupo é Null) */
export const medicalSpecialties = [
  { value: 'anestesiologia', label: 'Anestesiologia' },
  { value: 'cardiologia', label: 'Cardiologia' },
  { value: 'cirurgia-geral', label: 'Cirurgia geral' },
  { value: 'cirurgia-vascular', label: 'Cirurgia vascular' },
  { value: 'clinica-geral', label: 'Clínica geral' },
  { value: 'dermatologia', label: 'Dermatologia' },
  { value: 'endocrinologia', label: 'Endocrinologia' },
  { value: 'gastroenterologia', label: 'Gastroenterologia' },
  { value: 'ginecologia-e-obstetricia', label: 'Ginecologia e obstetrícia' },
  {
    value: 'hematologia-hemoterapia-e-terapia-celular',
    label: 'Hematologia, hemoterapia e terapia celular',
  },
  { value: 'infectologia', label: 'Infectologia' },
  { value: 'medicina-nuclear', label: 'Medicina nuclear' },
  { value: 'nefrologia', label: 'Nefrologia' },
  { value: 'neurologia', label: 'Neurologia' },
  { value: 'nutrologia', label: 'Nutrologia' },
  { value: 'oftalmologia', label: 'Oftalmologia' },
  { value: 'oncologia', label: 'Oncologia' },
  { value: 'ortopedia', label: 'Ortopedia' },
  { value: 'otorrinolaringologia', label: 'Otorrinolaringologia' },
  { value: 'pediatria', label: 'Pediatria' },
  { value: 'pneumologia', label: 'Pneumologia' },
  { value: 'psiquiatria', label: 'Psiquiatria' },
  { value: 'radiologia', label: 'Radiologia' },
  { value: 'radioterapia', label: 'Radioterapia' },
  { value: 'reumatologia', label: 'Reumatologia' },
]

/** Especialidades por tipo de credencial (não-CRM: opções específicas) */
export const specialtiesByCredential: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  CRM: medicalSpecialties,
  CREFITO: [
    { value: 'fisioterapia', label: 'Fisioterapia' },
    { value: 'terapia-ocupacional', label: 'Terapia Ocupacional' },
  ],
  CREF: [{ value: 'educacao-fisica', label: 'Educação Física' }],
  CRN: [{ value: 'nutricao', label: 'Nutrição' }],
  CRP: [
    { value: 'psicologia', label: 'Psicologia' },
    { value: 'saude-mental', label: 'Saúde Mental' },
  ],
  CRO: [{ value: 'odontologia', label: 'Odontologia' }],
  CRF: [{ value: 'farmacia', label: 'Farmácia' }],
}

/**
 * Retorna as especialidades permitidas para o tipo de credencial.
 * Se o tipo não estiver mapeado, retorna array vazio.
 */
export function getSpecialtiesForCredential(
  credentialType: string | undefined,
): Array<{ value: string; label: string }> {
  if (!credentialType) return []
  return specialtiesByCredential[credentialType] ?? []
}

/** @deprecated Use getSpecialtiesForCredential(type) ou medicalSpecialties. Mantido para compatibilidade. */
export const specialties = medicalSpecialties

export const frequencyUnits = [
  { value: 'Semanas', label: 'Semanas' },
  { value: 'Meses', label: 'Meses' },
]
