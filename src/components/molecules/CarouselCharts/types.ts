import { ReactNode } from 'react'

export type CarouselChartSlide = {
  id: string
  title: string
  subtitle?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  chart: ReactNode
}

export type CarouselChartGroup = {
  label: string
  helperText?: string
  slides: CarouselChartSlide[]
}
