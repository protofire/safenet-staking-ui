import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

const toneClass: Record<Tone, string> = {
  default: 'text-text-muted',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  accent: 'text-primary',
}

export function Pill({
  tone = 'default',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border border-current px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-[0.16em]',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
