'use client'

import { LegalContentTemplateProps } from './types'

export function LegalContentTemplate({
  pageTitle,
  sections,
}: LegalContentTemplateProps) {
  return (
    <section className="container mx-auto max-w-4xl px-4 py-8 md:px-6 lg:py-12">
      <h1 className="mb-8 text-center text-3xl font-bold md:text-4xl">
        {pageTitle}
      </h1>
      <article className="prose prose-lg max-w-none">
        <ol className="list-decimal space-y-6">
          {sections.map((section, index) => (
            <li key={index} className="mb-4">
              <strong>{section.title}</strong>
              {section.content.map((paragraph, pIndex) => (
                <div key={pIndex} className="mt-2 font-normal">
                  {paragraph}
                </div>
              ))}
            </li>
          ))}
        </ol>
      </article>
    </section>
  )
}
