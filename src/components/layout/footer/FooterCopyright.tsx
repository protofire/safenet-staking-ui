import { APP_COPYRIGHT } from '@/config/app'
import { cn } from '@/lib/utils'

const PROTOFIRE_URL = 'https://protofire.io'

export function FooterCopyright({
  copyright = APP_COPYRIGHT,
  className,
  stacked = false,
}: {
  copyright?: string
  className?: string
  stacked?: boolean
}) {
  const protofireLink = (
    <a
      href={PROTOFIRE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="font-bold text-primary transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
    >
      Protofire
    </a>
  )

  if (stacked) {
    return (
      <div className={cn('flex min-w-0 flex-col gap-1', className)}>
        <span className="font-mono text-2xs leading-snug tracking-wide text-text-subtle">
          {copyright}
        </span>
        <span className="font-mono text-2xs leading-snug tracking-wide text-text-subtle">
          Supported by {protofireLink}
        </span>
      </div>
    )
  }

  return (
    <span className={cn('font-mono text-2xs tracking-wide text-text-subtle', className)}>
      {copyright} Supported by {protofireLink}
    </span>
  )
}
