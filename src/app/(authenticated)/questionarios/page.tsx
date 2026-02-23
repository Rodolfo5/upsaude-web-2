import { Download } from 'lucide-react'

import { Button } from '@/components/atoms/Button/button'
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
        mainAction={
          <Button asChild variant="secondary-color" size="md">
            <a
              href="/questionnaire/Gabaritos questionários de saúde.pdf"
              download="Gabaritos questionários de saúde.pdf"
              className="flex w-auto items-center gap-2 rounded-md border border-primary-500 bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
            >
              <Download className="h-4 w-4" />
              Gabaritos
            </a>
          </Button>
        }
      />
    </div>
  )
}
