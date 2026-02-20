'use client'

import Autoplay from 'embla-carousel-autoplay'
import Link from 'next/link'
import * as React from 'react'
import { Dispatch, SetStateAction } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import {
  healthBiomarkersCarousel,
  useHealthBiomarkersCarousel,
} from './HealthBiomarkers/healthBiomarkers'
import { lifestyleCarousel } from './Lifestyle/lifestyle'
import {
  mentalHealthCarousel,
  useMentalHealthCarousel,
} from './MentalHealth/mentalHealth'
import { CarouselChartGroup, CarouselChartSlide } from './types'

interface CarouselChartsProps {
  selected: 'healthBiomarkers' | 'mentalHealth' | 'lifestyle'
  setSelected: Dispatch<
    SetStateAction<'healthBiomarkers' | 'mentalHealth' | 'lifestyle'>
  >
  patientId?: string
}

const selectOptions = [
  { value: 'healthBiomarkers', label: healthBiomarkersCarousel.label },
  { value: 'mentalHealth', label: mentalHealthCarousel.label },
  { value: 'lifestyle', label: lifestyleCarousel.label },
] as const

export function CarouselCharts({
  selected,
  setSelected,
  patientId,
}: CarouselChartsProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 4500, stopOnInteraction: true }),
  )
  const [api, setApi] = React.useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = React.useState(0)

  // Usar dados dinâmicos quando patientId disponível
  const mentalHealthDynamic = useMentalHealthCarousel(patientId)
  const healthBiomarkersDynamic = useHealthBiomarkersCarousel(patientId)

  const carouselGroupsDynamic: Record<
    CarouselChartsProps['selected'],
    CarouselChartGroup
  > = {
    healthBiomarkers: patientId
      ? healthBiomarkersDynamic
      : healthBiomarkersCarousel,
    mentalHealth: patientId ? mentalHealthDynamic : mentalHealthCarousel,
    lifestyle: lifestyleCarousel,
  }

  const activeGroup = carouselGroupsDynamic[selected]
  const shouldAutoplay = activeGroup.slides.length > 1

  React.useEffect(() => {
    if (!api) return

    const handleSelect = () => {
      setCurrentSlide(api.selectedScrollSnap())
    }

    handleSelect()
    api.on('select', handleSelect)

    return () => {
      api.off('select', handleSelect)
    }
  }, [api])

  React.useEffect(() => {
    setCurrentSlide(0)
  }, [selected])

  return (
    <Card className="w-full rounded-3xl border-gray-200 shadow-none">
      <CardHeader className="flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-gray-800 sm:text-2xl">
            <span className="text-brand-purple-dark">Áreas da Vida</span>
          </CardTitle>
        </div>

        <Select
          value={selected}
          onValueChange={(value) =>
            setSelected(value as CarouselChartsProps['selected'])
          }
        >
          <SelectTrigger className="w-full border-purple-100 text-sm font-medium sm:w-60 sm:min-w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="w-full min-w-0 pt-2 sm:pt-4">
        <Carousel
          key={selected}
          setApi={setApi}
          className="w-full"
          {...(shouldAutoplay
            ? {
                plugins: [plugin.current],
                onMouseEnter: plugin.current.stop,
                onMouseLeave: plugin.current.reset,
              }
            : {})}
        >
          <CarouselContent className="w-full">
            {activeGroup.slides.map((slide) => (
              <CarouselItem key={slide.id} className="pl-2 md:pl-4">
                <ChartCard
                  slide={slide}
                  carouselPrevious={
                    <CarouselPrevious className="static translate-y-0 border-none shadow-none hover:bg-transparent" />
                  }
                  carouselNext={
                    <CarouselNext className="static translate-y-0 border-none shadow-none hover:bg-transparent" />
                  }
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        {activeGroup.slides.length > 1 && (
          <div className="mt-4 flex justify-center gap-2 sm:mt-6">
            {activeGroup.slides.map((slide, index) => (
              <span
                key={slide.id}
                className={cn(
                  'h-1 rounded-full bg-gray-200 transition-all duration-300',
                  currentSlide === index
                    ? 'w-8 bg-primary-500 sm:w-10'
                    : 'w-3 sm:w-4',
                )}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type ChartCardProps = {
  slide: CarouselChartSlide
  carouselPrevious: React.ReactNode
  carouselNext: React.ReactNode
}

function ChartCard({ slide, carouselPrevious, carouselNext }: ChartCardProps) {
  return (
    <Card className="h-full border-none bg-transparent shadow-none">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <CardTitle className="text-base text-brand-purple-dark sm:text-lg">
            {slide.title}
          </CardTitle>
          {slide.subtitle && (
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              {slide.subtitle}
            </p>
          )}
          {slide.description && (
            <p className="text-xs text-gray-500 sm:text-sm">
              {slide.description}
            </p>
          )}
        </div>
        {slide.actionLabel && (
          <Link
            href={slide.actionHref || '#'}
            className="whitespace-nowrap text-xs font-medium text-primary-600 hover:underline sm:text-sm"
          >
            {slide.actionLabel}
          </Link>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div className="relative">
          {slide.chart}
          <div className="pointer-events-none absolute inset-0 -mx-3 flex items-center justify-between sm:-mx-6">
            <div className="pointer-events-auto rounded-full bg-white/80 p-1 shadow-sm backdrop-blur-sm transition-colors hover:bg-white">
              {carouselPrevious}
            </div>
            <div className="pointer-events-auto rounded-full bg-white/80 p-1 shadow-sm backdrop-blur-sm transition-colors hover:bg-white">
              {carouselNext}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
