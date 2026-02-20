import { DataTable } from '@/components/organisms/DataTable/dataTable'

import { questionnairesColumns, questionnaires } from './column'

export default function QuestionariosPage() {
  return (
    <div className="mt-8 flex h-auto w-full flex-col items-start justify-start gap-6 px-4 md:mt-12 md:px-10 lg:px-20">
      {/* Cabeçalho */}
      <div className="flex w-full flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-start justify-start gap-3 text-center md:text-left">
          <h1 className="text-2xl font-semibold text-purple-800 md:text-3xl">
            Questionários de Saúde
          </h1>
          <p className="text-sm text-gray-600 md:text-base">
            Visualize os questionários de saúde e aplique-os aos pacientes para
            apoiar a avaliação clínica e o acompanhamento da saúde
          </p>
        </div>
      </div>

      <DataTable
        columns={questionnairesColumns}
        data={questionnaires}
        searchColumn="name"
        searchInputPlaceholder="Pesquisar questionário"
      />
    </div>
  )
}
