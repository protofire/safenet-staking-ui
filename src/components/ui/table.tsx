import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function TableHead({ className, scope = 'col', ...props }: ComponentProps<'th'>) {
  return (
    <th
      scope={scope}
      className={cn(
        'whitespace-nowrap px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.07em] text-text-muted sm:px-5',
        className,
      )}
      {...props}
    />
  )
}
