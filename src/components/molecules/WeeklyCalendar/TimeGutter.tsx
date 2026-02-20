import { Clock } from 'lucide-react'
import React from 'react'

interface TimeGutterProps {
  CELL_HEIGHT: number
}

const hours = Array.from({ length: 24 }, (_, i) => i)

export const TimeGutter: React.FC<TimeGutterProps> = ({ CELL_HEIGHT }) => {
  return (
    <div className="w-16 border-r bg-gray-50 md:w-20">
      <div
        className="flex items-center justify-center border-b bg-white"
        style={{ height: `${CELL_HEIGHT}px` }}
      >
        <Clock size={20} className="text-purple-600" />
      </div>
      {hours.map((h) => (
        <div
          key={`hour-label-${h}`}
          className="hour-row relative flex items-start justify-center border-b border-gray-100 pt-1"
          style={{ height: `${CELL_HEIGHT}px` }}
        >
          <span className="text-xs font-medium text-gray-500">
            {h.toString().padStart(2, '0')}:00
          </span>
        </div>
      ))}
    </div>
  )
}
