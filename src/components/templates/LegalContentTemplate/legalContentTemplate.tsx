'use client'

import { LegalContentTemplateProps } from './types'

export function LegalContentTemplate({
  pageTitle,
  sections,
}: LegalContentTemplateProps) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="bg-gradient-to-r from-[#792EBD] to-[#EB34EF] px-4 py-10 text-center shadow-md">
        <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
          {pageTitle}
        </h1>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 lg:py-14">
        <div className="rounded-xl bg-white shadow-sm">
          <ol className="divide-y divide-gray-100">
            {sections.map((section, index) => (
              <li key={index} className="px-6 py-6 md:px-8">
                <h2 className="mb-3 text-base font-semibold text-[#792EBD] md:text-lg">
                  {index + 1}. {section.title}
                </h2>
                <div className="space-y-2 text-sm leading-relaxed text-gray-700 md:text-base">
                  {section.content.map((paragraph, pIndex) => (
                    <div key={pIndex}>{paragraph}</div>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
