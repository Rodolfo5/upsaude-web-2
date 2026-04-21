import specialtiesData from './memed-specialties.json'

export interface MemedSpecialtyItem {
  type: string
  id: number
  attributes: { nome: string; grupo: string }
  links: { self: string }
}

export const memedSpecialtiesRaw = specialtiesData as MemedSpecialtyItem[]

function normalizeGroup(item: MemedSpecialtyItem): string {
  const grupo = item.attributes.grupo
  const nome = item.attributes.nome
  if (!grupo || grupo === 'Null') return nome
  const lower = grupo.toLowerCase()
  if (lower === 'clinica geral' || lower === 'clinica médica' || lower === 'clinica medica')
    return 'Clínica geral'
  if (lower === 'neurologia') return 'Neurologia'
  return grupo
}

export const memedGroupToIds: Record<string, number[]> = (() => {
  const map: Record<string, number[]> = {}
  memedSpecialtiesRaw.forEach((item) => {
    const group = normalizeGroup(item)
    if (!map[group]) map[group] = []
    map[group].push(item.id)
  })
  return map
})()

export const specialtyValueToMemedGroup: Record<string, string> = {
  anestesiologia: 'Anestesiologia',
  cardiologia: 'Cardiologia',
  'cirurgia-geral': 'Cirurgia geral',
  'cirurgia-vascular': 'Cirurgia vascular',
  'clinica-geral': 'Clínica geral',
  dermatologia: 'Dermatologia',
  endocrinologia: 'Endocrinologia',
  gastroenterologia: 'Gastroenterologia',
  'ginecologia-e-obstetricia': 'Ginecologia e obstetrícia',
  'hematologia-hemoterapia-e-terapia-celular': 'Hematologia, hemoterapia e terapia celular',
  infectologia: 'Infectologia',
  'medicina-nuclear': 'Medicina nuclear',
  nefrologia: 'Nefrologia',
  neurologia: 'Neurologia',
  nutrologia: 'Nutrologia',
  oftalmologia: 'Oftalmologia',
  oncologia: 'Oncologia',
  ortopedia: 'Ortopedia',
  otorrinolaringologia: 'Otorrinolaringologia',
  pediatria: 'Pediatria',
  pneumologia: 'Pneumologia',
  psiquiatria: 'Psiquiatria',
  radiologia: 'Radiologia',
  radioterapia: 'Radioterapia',
  reumatologia: 'Reumatologia',
}
