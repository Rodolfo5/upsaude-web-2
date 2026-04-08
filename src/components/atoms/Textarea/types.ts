import { VariantProps } from 'class-variance-authority'
import { ComponentProps } from 'react'

import { textareaVariants } from './textarea'

export interface TextareaProps
  extends ComponentProps<'textarea'>, VariantProps<typeof textareaVariants> {}
