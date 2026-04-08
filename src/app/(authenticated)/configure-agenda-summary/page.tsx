'use client'

import { AgendaSummaryForm } from '@/components/organisms/Forms/AgendaSummaryForm/agendaSummaryForm'

export default function ConfigureAgendaSummary() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex min-h-24 w-full flex-shrink-0 items-center justify-between bg-[#4B1F7C] px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Configure sua agenda
          </h1>
          <p className="mt-1 text-xs text-white/90 sm:text-sm">
            Assim, os pacientes encontrarão horários disponíveis e agendem suas
            consultas de forma prática.
          </p>
        </div>
        <button className="shrink-0 text-white" type="button">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex w-full flex-shrink-0 justify-center overflow-hidden bg-white py-4">
        <div className="flex max-w-full items-center gap-1 px-2 sm:gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#792EBD] text-sm font-medium text-white sm:h-8 sm:w-8">
            1
          </div>
          <div className="h-0.5 w-12 bg-[#792EBD] sm:w-24 md:w-32 lg:w-[200px] xl:w-[460px]" />
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#792EBD] text-sm font-medium text-white sm:h-8 sm:w-8">
            2
          </div>
          <div className="h-0.5 w-12 bg-[#792EBD] sm:w-24 md:w-32 lg:w-[200px] xl:w-[460px]" />
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#792EBD] text-sm font-medium text-white sm:h-8 sm:w-8">
            3
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-1 flex-col justify-center bg-white px-4 py-6 sm:px-8 lg:px-12">
          <AgendaSummaryForm />
        </div>
      </div>
    </div>
  )
}
