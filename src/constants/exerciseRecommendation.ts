export interface Option {
  value: string
  label: string
}

// Modalidades
export const modalityOptions: Option[] = [
  { value: 'Funcional', label: 'Funcional' },
  { value: 'Musculação', label: 'Musculação' },
  { value: 'Aeróbico', label: 'Aeróbico' },
  { value: 'Esportes', label: 'Esportes' },
]

// Intensidades
export const intensityOptions: Option[] = [
  { value: 'Baixa', label: 'Baixa' },
  { value: 'Média', label: 'Média' },
  { value: 'Alta', label: 'Alta' },
]

// Frequência - Valores
export const frequencyValueOptions: Option[] = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
  { value: '4', label: '4x' },
  { value: '5', label: '5x' },
  { value: '6', label: '6x' },
  { value: '7', label: '7x' },
]

// Frequência - Unidades
export const frequencyUnitOptions: Option[] = [
  { value: 'Dia', label: 'Dia' },
  { value: 'Semana', label: 'Semana' },
  { value: 'Mês', label: 'Mês' },
]

// Categorias/Focos por Modalidade
export const categoryOptionsByModality: Record<string, Option[]> = {
  Funcional: [
    { value: 'Alongamento', label: 'Alongamento' },
    { value: 'Circuito', label: 'Circuito' },
    { value: 'Força', label: 'Força' },
    { value: 'HITT', label: 'HITT' },
    { value: 'Mobilidade', label: 'Mobilidade' },
  ],
  Musculação: [
    { value: 'Core', label: 'Core' },
    { value: 'Membros Inferiores', label: 'Membros Inferiores' },
    {
      value: 'Membros Superiores (braços)',
      label: 'Membros Superiores (braços)',
    },
    {
      value: 'Membros Superiores (costas)',
      label: 'Membros Superiores (costas)',
    },
    {
      value: 'Membros Superiores (peito)',
      label: 'Membros Superiores (peito)',
    },
  ],
  Aeróbico: [
    { value: 'Caminhada', label: 'Caminhada' },
    { value: 'Cardio em Aparelhos', label: 'Cardio em Aparelhos' },
    { value: 'Ciclismo', label: 'Ciclismo' },
    { value: 'Corrida', label: 'Corrida' },
    { value: 'Natação', label: 'Natação' },
  ],
  Esportes: [
    { value: 'Aikidô', label: 'Aikidô' },
    { value: 'Asa-delta', label: 'Asa-delta' },
    { value: 'Atletismo', label: 'Atletismo' },
    { value: 'Badminton', label: 'Badminton' },
    { value: 'Basquete', label: 'Basquete' },
    { value: 'Beisebol', label: 'Beisebol' },
    { value: 'Boxe', label: 'Boxe' },
    { value: 'Bungee jump', label: 'Bungee jump' },
    { value: 'Caiaque', label: 'Caiaque' },
    { value: 'Calistenia', label: 'Calistenia' },
    { value: 'Canoagem', label: 'Canoagem' },
    { value: 'Capoeira', label: 'Capoeira' },
    { value: 'Ciclismo', label: 'Ciclismo' },
    { value: 'Cricket', label: 'Cricket' },
    { value: 'CrossFit', label: 'CrossFit' },
    { value: 'Escalada', label: 'Escalada' },
    { value: 'Esgrima', label: 'Esgrima' },
    { value: 'E-sports', label: 'E-sports' },
    { value: 'Futebol', label: 'Futebol' },
    {
      value: 'Ginástica (artística, rítmica, acrobática)',
      label: 'Ginástica (artística, rítmica, acrobática)',
    },
    { value: 'Golfe', label: 'Golfe' },
    { value: 'Handebol', label: 'Handebol' },
    { value: 'Hiking/Trilha', label: 'Hiking/Trilha' },
    {
      value: 'Hipismo (salto, adestramento, CCE)',
      label: 'Hipismo (salto, adestramento, CCE)',
    },
    { value: 'Hóquei sobre grama', label: 'Hóquei sobre grama' },
    { value: 'Jiu-jitsu', label: 'Jiu-jitsu' },
    { value: 'Judô', label: 'Judô' },
    { value: 'Karatê', label: 'Karatê' },
    { value: 'Kickboxing', label: 'Kickboxing' },
    { value: 'Kitesurf', label: 'Kitesurf' },
    { value: 'Krav Magá', label: 'Krav Magá' },
    { value: 'Lacrosse', label: 'Lacrosse' },
    { value: 'Mergulho', label: 'Mergulho' },
    { value: 'Muay Thai', label: 'Muay Thai' },
    { value: 'Natação', label: 'Natação' },
    { value: 'Parapente', label: 'Parapente' },
    { value: 'Paraquedismo', label: 'Paraquedismo' },
    { value: 'Parkour', label: 'Parkour' },
    { value: 'Patinação artística', label: 'Patinação artística' },
    { value: 'Polo (cavalos)', label: 'Polo (cavalos)' },
    { value: 'Polo aquático', label: 'Polo aquático' },
    { value: 'Powerlifting', label: 'Powerlifting' },
    { value: 'Rafting', label: 'Rafting' },
    { value: 'Remo', label: 'Remo' },
    { value: 'Skate', label: 'Skate' },
    { value: 'Softbol', label: 'Softbol' },
    { value: 'Squash', label: 'Squash' },
    { value: 'Surf', label: 'Surf' },
    { value: 'Taekwondo', label: 'Taekwondo' },
    { value: 'Tênis', label: 'Tênis' },
    {
      value: 'Tênis de mesa (Pingue-pongue)',
      label: 'Tênis de mesa (Pingue-pongue)',
    },
    { value: 'Vela', label: 'Vela' },
    { value: 'Vôlei', label: 'Vôlei' },
    { value: 'Windsurf', label: 'Windsurf' },
    { value: 'Wingsuit', label: 'Wingsuit' },
    { value: 'Wrestling (Luta Olímpica)', label: 'Wrestling (Luta Olímpica)' },
    { value: 'Xadrez', label: 'Xadrez' },
  ],
}

export const getCategoryOptions = (modalities: string[]): Option[] => {
  if (!modalities || modalities.length === 0) {
    return []
  }

  const allCategories = new Map<string, Option>()

  modalities.forEach((modality) => {
    const categories = categoryOptionsByModality[modality] || []
    categories.forEach((category) => {
      allCategories.set(category.value, category)
    })
  })

  return Array.from(allCategories.values())
}

export const allowsDistance = (category: string): boolean => {
  return category === 'Caminhada' || category === 'Corrida'
}
