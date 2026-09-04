import { APP_VERSION } from '@/config/app'
import { cn } from '@/lib/utils'

export function FooterMeta({
  version = APP_VERSION,
  className,
}: {
  version?: string
  className?: string
}) {
  return (
    <div className={cn('text-[11px] text-text-muted', className)}>
      <span className="inline-flex items-center">
        <span className="mr-[5px] font-mono text-[9px] uppercase tracking-wider text-text-subtle">
          v{version}
        </span>
      </span>
    </div>
  )
}
