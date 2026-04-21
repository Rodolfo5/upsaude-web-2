import type { Questionnaire } from './types'

export const FINDRISC: Questionnaire = {
  text: '',
  questions: [
    {
      question: 'Idade',
      options: [
        { label: 'Menos de 45 anos', value: 'Menos de 45 anos', valueNumber: 0 },
        { label: '45-54 anos', value: '45-54 anos', valueNumber: 2 },
        { label: '55-64 anos', value: '55-64 anos', valueNumber: 3 },
        { label: 'Mais de 64 anos', value: 'Mais de 64 anos', valueNumber: 4 },
      ],
    },
    {
      question: 'Índice de Massa Corporal (IMC)',
      options: [
        { label: 'Abaixo de 25 kg/m²', value: 'Abaixo de 25 kg/m²', valueNumber: 0 },
        { label: 'Entre 25 e 30 kg/m²', value: 'Entre 25 e 30 kg/m²', valueNumber: 1 },
        { label: 'Acima de 30 kg/m²', value: 'Acima de 30 kg/m²', valueNumber: 3 },
      ],
    },
    {
      question: 'Circunferência da Cintura',
      options: [
        { label: 'Homens: < 94 cm; Mulheres: < 80 cm', value: 'Homens: < 94 cm; Mulheres: < 80 cm', valueNumber: 0 },
        { label: 'Homens: 94-102 cm; Mulheres: 80-88 cm', value: 'Homens: 94-102 cm; Mulheres: 80-88 cm', valueNumber: 3 },
        { label: 'Homens: > 102 cm; Mulheres: > 88 cm', value: 'Homens: > 102 cm; Mulheres: > 88 cm', valueNumber: 4 },
      ],
    },
    {
      question: 'Você pratica pelo menos 30 minutos de atividade física todos os dias?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 0 },
        { label: 'Não', value: 'Não', valueNumber: 2 },
      ],
    },
    {
      question: 'Com que frequência você come vegetais, frutas ou legumes?',
      options: [
        { label: 'Todos os dias', value: 'Todos os dias', valueNumber: 0 },
        { label: 'Nem todos os dias', value: 'Nem todos os dias', valueNumber: 1 },
      ],
    },
    {
      question: 'Você já tomou medicação para pressão alta regularmente?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 2 },
        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },
    {
      question: 'Já foi encontrado um nível de glicose (açúcar) alto em algum exame?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 5 },
        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },
    {
      question: 'Algum membro da sua família já foi diagnosticado com diabetes?',
      options: [
        { label: 'Não', value: 'Não', valueNumber: 0 },
        { label: 'Sim: avós, tios ou primos', value: 'Sim: avós, tios ou primos', valueNumber: 3 },
        { label: 'Sim: pais, irmãos ou filhos', value: 'Sim: pais, irmãos ou filhos', valueNumber: 5 },
      ],
    },
  ],
}
