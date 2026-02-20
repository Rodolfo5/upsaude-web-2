'use client'

import { Button } from '@/components/atoms/Button/button'
import type { ButtonProps } from '@/components/atoms/Button/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RestrictedButtonProps extends ButtonProps {
  hasPermission: boolean
  tooltipMessage?: string
}

export function RestrictedButton({
  hasPermission,
  tooltipMessage,
  disabled,
  children,
  ...buttonProps
}: RestrictedButtonProps) {
  const isDisabled = !hasPermission || disabled

  // Se tem permissão ou não tem tooltip, renderizar botão normal
  if (hasPermission || !tooltipMessage) {
    return (
      <Button disabled={isDisabled} {...buttonProps}>
        {children}
      </Button>
    )
  }

  // Se não tem permissão e tem tooltip, renderizar com tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <Button disabled={isDisabled} {...buttonProps}>
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-gray-900 text-white">
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
