'use client'

import * as React from 'react'

import { Card } from '@/components/ui/card'

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// Dados do heatmap - 5 semanas x 7 dias
const heatmapData = [
  [3, 2, 0, 3, 2, 3, 0],
  [2, 3, 0, 1, 3, 2, 0],
  [2, 0, 2, 1, 3, 1, 3],
  [2, 1, 3, 1, 2, 3, 1],
  [3, 1, 3, 3, 0, 3, 3],
]

const colorMap: Record<number, string> = {
  0: '#DC2626', // Vermelho escuro
  1: '#F97316', // Laranja
  2: '#7C3AED', // Roxo
  3: '#E238E8', // Magenta
}

const colorLabels: Record<number, string> = {
  0: '0',
  1: '1',
  2: '2',
  3: '3',
}

export function ExerciseMonthChart() {
  return (
    <Card className="h-[280px] w-full border-none bg-gradient-to-b from-white to-[#F8F5FF] px-4 pt-4 shadow-none">
      <div className="flex h-full items-center gap-6">
        {/* Legenda vertical */}
        <div className="flex flex-col justify-center">
          {[3, 2, 1, 0].map((level) => (
            <div key={level} className="flex flex-row items-center gap-1">
              <div
                className={`flex h-8 w-6 items-center justify-center text-xs font-medium text-gray-700 ${level === 0 && 'rounded-b-xl'} ${level === 3 && 'rounded-t-xl'}`}
                style={{ backgroundColor: colorMap[level] }}
              ></div>
              <p>{colorLabels[level]}</p>
            </div>
          ))}
        </div>

        {/* Grid do heatmap */}
        <div className="flex flex-1 flex-col gap-2">
          {heatmapData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-2">
              {week.map((value, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="h-9 flex-1 rounded-lg"
                  style={{ backgroundColor: colorMap[value] }}
                />
              ))}
            </div>
          ))}

          {/* Labels dos dias da semana */}
          <div className="mt-1 flex gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="flex-1 text-center text-xs text-gray-600"
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
