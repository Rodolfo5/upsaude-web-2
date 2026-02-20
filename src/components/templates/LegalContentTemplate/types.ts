import { ReactNode } from 'react'

export interface LegalSection {
  title: string
  content: ReactNode[]
}

export interface LegalContentTemplateProps {
  pageTitle: string
  sections: LegalSection[]
}
