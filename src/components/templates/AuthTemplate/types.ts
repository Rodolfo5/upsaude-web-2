import { ReactNode } from 'react'

export interface AuthTemplateProps {
  title: string
  subtitle?: string
  form: ReactNode
  footerLink?: {
    text: string
    linkText: string
    href: string
  }
  secondaryAction?: ReactNode
}
