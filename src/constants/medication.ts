export const usageClassificationOptions = [
  { label: 'Uso contínuo', value: 'Uso contínuo' },
  { label: 'Tratamento', value: 'Tratamento' },
  { label: 'Sintomático', value: 'Sintomático' },
]

export const pharmaceuticalFormOptions = [
  { label: 'Comprimido', value: 'Comprimido' },
  { label: 'Cápsula', value: 'Cápsula' },
  { label: 'Líquido', value: 'Líquido' },
  { label: 'Pó para suspensão', value: 'Pó para suspensão' },
  { label: 'Injetável', value: 'Injetável' },
  { label: 'Pomada', value: 'Pomada' },
  { label: 'Tópico', value: 'Tópico' },
]

export const concentrationUnitOptions = [
  { label: 'mg', value: 'mg' },
  { label: 'g', value: 'g' },
  { label: 'mg/mL', value: 'mg/mL' },
  { label: 'g/mL', value: 'g/mL' },
  { label: 'mL', value: 'mL' },
  { label: 'ul/mL', value: 'ul/mL' },
  { label: 'gotas', value: 'gotas' },
  { label: 'spray', value: 'spray' },
  { label: 'patches', value: 'patches' },
  { label: 'mg/h', value: 'mg/h' },
  { label: 'cm de tira', value: 'cm de tira' },
  { label: 'upd', value: 'upd' },
]

export const getConcentrationUnitOptionsByPharmaceuticalForm = (
  pharmaceuticalForm: string,
) => {
  switch (pharmaceuticalForm) {
    case 'Comprimido':
    case 'Cápsula':
    case 'Pó para suspensão':
      return [{ label: 'mg', value: 'mg' }]
    case 'Líquido':
      return [
        { label: 'mg/mL', value: 'mg/mL' },
        { label: 'mL', value: 'mL' },
      ]
    case 'Tópico':
      return [
        { label: 'gotas', value: 'gotas' },
        { label: 'spray', value: 'spray' },
        { label: 'patches', value: 'patches' },
        { label: 'mg/h', value: 'mg/h' },
      ]
    case 'Injetável':
      return [
        { label: 'mg/mL', value: 'mg/mL' },
        { label: 'ul/mL', value: 'ul/mL' },
      ]
    case 'Pomada':
      return [
        { label: 'g', value: 'g' },
        { label: 'cm de tira', value: 'cm de tira' },
        { label: 'upd', value: 'upd' },
      ]
    default:
      return concentrationUnitOptions
  }
}

export const stockUnitOptions = [
  { label: 'Cápsula', value: 'Cápsula' },
  { label: 'Comprimido', value: 'Comprimido' },
  { label: 'mL', value: 'mL' },
  { label: 'g', value: 'g' },
  { label: 'mL', value: 'mL' },
]

export const doseUnitOptions = [
  { label: 'Comprimido', value: 'Comprimido' },
  { label: 'Cápsula', value: 'Cápsula' },
  { label: 'Sache', value: 'Sache' },
  { label: 'Medidor', value: 'Medidor' },
  { label: 'mL', value: 'mL' },
  { label: 'Colheres', value: 'Colheres' },
  { label: 'Gotas', value: 'Gotas' },
  { label: 'Jatos', value: 'Jatos' },
  { label: 'Adesivo', value: 'Adesivo' },
  { label: 'ul', value: 'ul' },
  { label: 'mL/h', value: 'mL/h' },
  { label: 'Dedo', value: 'Dedo' },
  { label: 'g', value: 'g' },
]

export const getDoseUnitOptionsByPharmaceuticalForm = (
  pharmaceuticalForm: string,
) => {
  switch (pharmaceuticalForm) {
    case 'Comprimido':
      return [{ label: 'Comprimido', value: 'Comprimido' }]
    case 'Cápsula':
      return [{ label: 'Cápsula', value: 'Cápsula' }]
    case 'Pó para suspensão':
      return [
        { label: 'Sache', value: 'Sache' },
        { label: 'Medidor', value: 'Medidor' },
      ]
    case 'Líquido':
      return [
        { label: 'mL', value: 'mL' },
        { label: 'Colheres', value: 'Colheres' },
      ]
    case 'Tópico':
      return [
        { label: 'Gotas', value: 'Gotas' },
        { label: 'Jatos', value: 'Jatos' },
        { label: 'Adesivo', value: 'Adesivo' },
      ]
    case 'Injetável':
      return [
        { label: 'mL', value: 'mL' },
        { label: 'ul', value: 'ul' },
        { label: 'mL/h', value: 'mL/h' },
      ]
    case 'Pomada':
      return [
        { label: 'Dedo', value: 'Dedo' },
        { label: 'mL', value: 'mL' },
        { label: 'g', value: 'g' },
      ]
    default:
      return doseUnitOptions
  }
}

export const intervalUnitOptions = [
  { label: 'Horas', value: 'Horas' },
  { label: 'Dias', value: 'Dias' },
]

export const methodOfMeasurementOptions = [
  { label: 'Sachê', value: 'Sachê' },
  { label: 'Medidor(mg)', value: 'Medidor(mg)' },
  { label: 'Colher', value: 'Colher' },
  { label: 'Seringa', value: 'Seringa' },
  { label: 'Copo', value: 'Copo' },
  { label: 'Conta-gotas', value: 'Conta-gotas' },
  { label: 'Fraco spray', value: 'Fraco spray' },
  { label: 'Adesivo', value: 'Adesivo' },
  { label: 'Caneta injetora', value: 'Caneta injetora' },
  { label: 'Bomba de infusão', value: 'Bomba de infusão' },
  { label: 'Dedo', value: 'Dedo' },
  { label: 'Aplicador dosador', value: 'Aplicador dosador' },
]

export const getMethodOfMeasurementOptionsByPharmaceuticalForm = (
  pharmaceuticalForm: string,
) => {
  switch (pharmaceuticalForm) {
    case 'Pó para suspensão':
      return [
        { label: 'Sachê', value: 'Sachê' },
        { label: 'Medidor(mg)', value: 'Medidor(mg)' },
      ]
    case 'Líquido':
      return [
        { label: 'Colher', value: 'Colher' },
        { label: 'Seringa', value: 'Seringa' },
        { label: 'Copo', value: 'Copo' },
      ]
    case 'Tópico':
      return [
        { label: 'Conta-gotas', value: 'Conta-gotas' },
        { label: 'Fraco spray', value: 'Fraco spray' },
        { label: 'Adesivo', value: 'Adesivo' },
      ]
    case 'Injetável':
      return [
        { label: 'Seringa', value: 'Seringa' },
        { label: 'Caneta injetora', value: 'Caneta injetora' },
        { label: 'Bomba de infusão', value: 'Bomba de infusão' },
      ]
    case 'Pomada':
      return [
        { label: 'Dedo', value: 'Dedo' },
        { label: 'Aplicador dosador', value: 'Aplicador dosador' },
      ]
    default:
      return []
  }
}

/**
 * Retorna a unidade de dose baseada no método de medição selecionado
 */
export const getDoseUnitByMethodOfMeasurement = (
  methodOfMeasurement: string,
): string | null => {
  switch (methodOfMeasurement) {
    // Pó para suspensão
    case 'Sachê':
      return 'Sache'
    case 'Medidor(mg)':
      return 'Medidor'
    // Líquido
    case 'Colher':
      return 'Colheres'
    case 'Seringa':
      return 'mL'
    case 'Copo':
      return 'mL'
    // Tópico
    case 'Conta-gotas':
      return 'Gotas'
    case 'Fraco spray':
      return 'Jatos'
    case 'Adesivo':
      return 'Adesivo'
    // Injetável
    case 'Caneta injetora':
      return 'ul'
    case 'Bomba de infusão':
      return 'mL/h'
    // Pomada
    case 'Dedo':
      return 'Dedo'
    case 'Aplicador dosador':
      return null // Pode ser mL ou g, precisa de seleção
    default:
      return null
  }
}

/**
 * Retorna as opções de unidade de dose baseadas no método de medição
 */
export const getDoseUnitOptionsByMethodOfMeasurement = (
  methodOfMeasurement: string,
) => {
  switch (methodOfMeasurement) {
    // Pó para suspensão
    case 'Sachê':
      return [{ label: 'Sache', value: 'Sache' }]
    case 'Medidor(mg)':
      return [{ label: 'Medidor', value: 'Medidor' }]
    // Líquido
    case 'Colher':
      return [{ label: 'Colheres', value: 'Colheres' }]
    case 'Copo':
      return [{ label: 'mL', value: 'mL' }]
    // Tópico
    case 'Conta-gotas':
      return [{ label: 'Gotas', value: 'Gotas' }]
    case 'Fraco spray':
      return [{ label: 'Jatos', value: 'Jatos' }]
    case 'Adesivo':
      return [{ label: 'Adesivo', value: 'Adesivo' }]
    // Injetável
    case 'Seringa':
      return [{ label: 'mL', value: 'mL' }]
    case 'Caneta injetora':
      return [{ label: 'ul', value: 'ul' }]
    case 'Bomba de infusão':
      return [{ label: 'mL/h', value: 'mL/h' }]
    // Pomada
    case 'Dedo':
      return [{ label: 'Dedo', value: 'Dedo' }]
    case 'Aplicador dosador':
      return [
        { label: 'mL', value: 'mL' },
        { label: 'g', value: 'g' },
      ]
    default:
      return []
  }
}
