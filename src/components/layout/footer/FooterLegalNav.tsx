import { FooterLinkItem } from './FooterLinkItem'
import type { FooterLink } from './types'
import { cn } from '@/lib/utils'

export function FooterLegalNav({
  links,
  className,
  ariaLabel = 'Footer links',
}: {
  links: FooterLink[]
  className?: string
  ariaLabel?: string
}) {
  return (
    <nav
      className={cn('flex items-center gap-x-3 sm:shrink-0 sm:gap-[18px]', className)}
      aria-label={ariaLabel}
    >
      {links.map((link) => (
        <FooterLinkItem key={link.label} {...link} />
      ))}
    </nav>
  )
}
