import { cn } from '@/lib/utils'

export interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function StepIndicator({
  currentStep,
  totalSteps,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber <= currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <div
            key={stepNumber}
            className={cn(
              'h-2 flex-1 rounded-full transition-all duration-300',
              {
                'bg-pink-500': isCompleted,
                'bg-gray-300': !isCompleted,
                'bg-pink-600': isCurrent,
              },
            )}
          />
        )
      })}
    </div>
  )
}
