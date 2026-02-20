export interface MemedSpecialtyItem {
  type: string
  id: number
  attributes: { nome: string; grupo: string }
  links: { self: string }
}

export const memedSpecialtiesRaw: MemedSpecialtyItem[] = [
  {
    type: 'especialidades',
    id: 1,
    attributes: { nome: 'Acupuntura', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/1',
    },
  },
  {
    type: 'especialidades',
    id: 63,
    attributes: { nome: 'Alergia e Imunologia', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/63',
    },
  },
  {
    type: 'especialidades',
    id: 2,
    attributes: { nome: 'Alergia e imunopatologia', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/2',
    },
  },
  {
    type: 'especialidades',
    id: 64,
    attributes: { nome: 'Anestesia', grupo: 'Anestesiologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/64',
    },
  },
  {
    type: 'especialidades',
    id: 3,
    attributes: { nome: 'Anestesiologia', grupo: 'Anestesiologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/3',
    },
  },
  {
    type: 'especialidades',
    id: 4,
    attributes: {
      nome: 'Angiologia e cirurgia vascular',
      grupo: 'Cirurgia vascular',
    },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/4',
    },
  },
  {
    type: 'especialidades',
    id: 65,
    attributes: { nome: 'Atendimento domiciliar', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/65',
    },
  },
  {
    type: 'especialidades',
    id: 57,
    attributes: { nome: 'Canabinologia', grupo: 'Clínica Médica' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/57',
    },
  },
  {
    type: 'especialidades',
    id: 5,
    attributes: { nome: 'Cardiologia', grupo: 'Cardiologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/5',
    },
  },
  {
    type: 'especialidades',
    id: 6,
    attributes: { nome: 'Cirurgia cardiovascular', grupo: 'Cardiologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/6',
    },
  },
  {
    type: 'especialidades',
    id: 7,
    attributes: { nome: 'Cirurgia da mão', grupo: 'Ortopedia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/7',
    },
  },
  {
    type: 'especialidades',
    id: 8,
    attributes: {
      nome: 'Cirurgia de cabeça e pescoço',
      grupo: 'Cirurgia geral',
    },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/8',
    },
  },
  {
    type: 'especialidades',
    id: 9,
    attributes: { nome: 'Cirurgia digestiva', grupo: 'Gastroenterologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/9',
    },
  },
  {
    type: 'especialidades',
    id: 51,
    attributes: { nome: 'Cirurgia endocrinológica', grupo: 'Endocrinologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/51',
    },
  },
  {
    type: 'especialidades',
    id: 10,
    attributes: { nome: 'Cirurgia geral', grupo: 'Cirurgia geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/10',
    },
  },
  {
    type: 'especialidades',
    id: 50,
    attributes: { nome: 'Cirurgia oncológica', grupo: 'Oncologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/50',
    },
  },
  {
    type: 'especialidades',
    id: 11,
    attributes: { nome: 'Cirurgia pediátrica', grupo: 'Pediatria' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/11',
    },
  },
  {
    type: 'especialidades',
    id: 12,
    attributes: { nome: 'Cirurgia plástica', grupo: 'Dermatologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/12',
    },
  },
  {
    type: 'especialidades',
    id: 13,
    attributes: { nome: 'Cirurgia torácica', grupo: 'Cirurgia geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/13',
    },
  },
  {
    type: 'especialidades',
    id: 14,
    attributes: { nome: 'Clínica médica', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/14',
    },
  },
  {
    type: 'especialidades',
    id: 15,
    attributes: { nome: 'Coloproctologia', grupo: 'Gastroenterologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/15',
    },
  },
  {
    type: 'especialidades',
    id: 16,
    attributes: { nome: 'Dermatologia', grupo: 'Dermatologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/16',
    },
  },
  {
    type: 'especialidades',
    id: 17,
    attributes: {
      nome: 'Endocrinologia e metabologia',
      grupo: 'Endocrinologia',
    },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/17',
    },
  },
  {
    type: 'especialidades',
    id: 18,
    attributes: { nome: 'Endoscopia digestiva', grupo: 'Gastroenterologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/18',
    },
  },
  {
    type: 'especialidades',
    id: 19,
    attributes: { nome: 'Gastroenterologia', grupo: 'Gastroenterologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/19',
    },
  },
  {
    type: 'especialidades',
    id: 59,
    attributes: { nome: 'Generalista', grupo: 'Clínica Médica' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/59',
    },
  },
  {
    type: 'especialidades',
    id: 56,
    attributes: { nome: 'Genética médica', grupo: 'Clínica médica' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/56',
    },
  },
  {
    type: 'especialidades',
    id: 20,
    attributes: { nome: 'Geriatria e gerontologia', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/20',
    },
  },
  {
    type: 'especialidades',
    id: 21,
    attributes: {
      nome: 'Ginecologia e obstetrícia',
      grupo: 'Ginecologia e obstetrícia',
    },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/21',
    },
  },
  {
    type: 'especialidades',
    id: 22,
    attributes: {
      nome: 'Hematologia, hemoterapia e terapia celular',
      grupo: 'Null',
    },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/22',
    },
  },
  {
    type: 'especialidades',
    id: 23,
    attributes: { nome: 'Hepatologia', grupo: 'Gastroenterologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/23',
    },
  },
  {
    type: 'especialidades',
    id: 24,
    attributes: { nome: 'Homeopatia', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/24',
    },
  },
  {
    type: 'especialidades',
    id: 25,
    attributes: { nome: 'Infectologia', grupo: 'Null' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/25',
    },
  },
  {
    type: 'especialidades',
    id: 26,
    attributes: { nome: 'Mastologia', grupo: 'Ginecologia e obstetrícia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/26',
    },
  },
  {
    type: 'especialidades',
    id: 60,
    attributes: { nome: 'Medicina de emergência', grupo: 'Clínica Geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/60',
    },
  },
  {
    type: 'especialidades',
    id: 27,
    attributes: {
      nome: 'Medicina de família e comunidade',
      grupo: 'Clínica geral',
    },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/27',
    },
  },
  {
    type: 'especialidades',
    id: 28,
    attributes: { nome: 'Medicina de tráfego', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/28',
    },
  },
  {
    type: 'especialidades',
    id: 29,
    attributes: {
      nome: 'Medicina do exercício e do esporte',
      grupo: 'Ortopedia',
    },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/29',
    },
  },
  {
    type: 'especialidades',
    id: 30,
    attributes: { nome: 'Medicina do trabalho', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/30',
    },
  },
  {
    type: 'especialidades',
    id: 31,
    attributes: { nome: 'Medicina física e reabilitação', grupo: 'Ortopedia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/31',
    },
  },
  {
    type: 'especialidades',
    id: 32,
    attributes: { nome: 'Medicina intensiva', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/32',
    },
  },
  {
    type: 'especialidades',
    id: 33,
    attributes: { nome: 'Medicina legal', grupo: 'Clínica geral' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/33',
    },
  },
  {
    type: 'especialidades',
    id: 34,
    attributes: { nome: 'Medicina nuclear', grupo: 'Null' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/34',
    },
  },
  {
    type: 'especialidades',
    id: 54,
    attributes: { nome: 'Medicina ortomolecular', grupo: 'Clínica médica' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/54',
    },
  },
  {
    type: 'especialidades',
    id: 55,
    attributes: {
      nome: 'Medicina preventiva e social',
      grupo: 'Clínica Médica',
    },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/55',
    },
  },
  {
    type: 'especialidades',
    id: 35,
    attributes: { nome: 'Nefrologia', grupo: 'Nefrologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/35',
    },
  },
  {
    type: 'especialidades',
    id: 36,
    attributes: { nome: 'Neurocirurgia', grupo: 'Neurologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/36',
    },
  },
  {
    type: 'especialidades',
    id: 37,
    attributes: { nome: 'Neurologia', grupo: 'Neurologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/37',
    },
  },
  {
    type: 'especialidades',
    id: 62,
    attributes: { nome: 'Neurologia pediátrica', grupo: 'neurologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/62',
    },
  },
  {
    type: 'especialidades',
    id: 38,
    attributes: { nome: 'Nutrição parenteral e enteral', grupo: 'Nutrologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/38',
    },
  },
  {
    type: 'especialidades',
    id: 39,
    attributes: { nome: 'Nutrologia', grupo: 'Nutrologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/39',
    },
  },
  {
    type: 'especialidades',
    id: 40,
    attributes: { nome: 'Oftalmologia', grupo: 'Oftalmologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/40',
    },
  },
  {
    type: 'especialidades',
    id: 41,
    attributes: { nome: 'Oncologia', grupo: 'Oncologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/41',
    },
  },
  {
    type: 'especialidades',
    id: 42,
    attributes: { nome: 'Ortopedia e traumatologia', grupo: 'Ortopedia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/42',
    },
  },
  {
    type: 'especialidades',
    id: 43,
    attributes: {
      nome: 'Otorrinolaringologia e cirurgia cérvico-facial',
      grupo: 'Otorrinolaringologia',
    },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/43',
    },
  },
  {
    type: 'especialidades',
    id: 52,
    attributes: { nome: 'Patologia', grupo: 'Clínica médica' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/52',
    },
  },
  {
    type: 'especialidades',
    id: 53,
    attributes: { nome: 'Patologia clínica', grupo: 'Clínica médica' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/53',
    },
  },
  {
    type: 'especialidades',
    id: 44,
    attributes: { nome: 'Pediatria', grupo: 'Pediatria' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/44',
    },
  },
  {
    type: 'especialidades',
    id: 45,
    attributes: { nome: 'Pneumologia e tisiologia', grupo: 'Pneumologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/45',
    },
  },
  {
    type: 'especialidades',
    id: 61,
    attributes: { nome: 'Pneumologia pediátrica', grupo: 'Pediatria' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/61',
    },
  },
  {
    type: 'especialidades',
    id: 46,
    attributes: { nome: 'Psiquiatria', grupo: 'Psiquiatria' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/46',
    },
  },
  {
    type: 'especialidades',
    id: 47,
    attributes: { nome: 'Radiologia', grupo: 'Null' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/47',
    },
  },
  {
    type: 'especialidades',
    id: 58,
    attributes: { nome: 'Radioterapia', grupo: 'Radioterapia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/58',
    },
  },
  {
    type: 'especialidades',
    id: 48,
    attributes: { nome: 'Reumatologia', grupo: 'Reumatologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/48',
    },
  },
  {
    type: 'especialidades',
    id: 49,
    attributes: { nome: 'Urologia', grupo: 'Nefrologia' },
    links: {
      self: 'https://integrations.api.memed.com.br/v1/especialidades/49',
    },
  },
]

function normalizeGroup(item: MemedSpecialtyItem): string {
  const grupo = item.attributes.grupo
  const nome = item.attributes.nome
  if (!grupo || grupo === 'Null') return nome
  const lower = grupo.toLowerCase()
  if (
    lower === 'clinica geral' ||
    lower === 'clinica médica' ||
    lower === 'clinica medica'
  )
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
  'hematologia-hemoterapia-e-terapia-celular':
    'Hematologia, hemoterapia e terapia celular',
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
