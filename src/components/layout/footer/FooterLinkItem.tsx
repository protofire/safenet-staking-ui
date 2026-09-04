import { Link } from 'react-router'

import type { FooterLink } from './types'

const linkClassName =
  'whitespace-nowrap text-xs text-text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2'

export function FooterLinkItem({ label, to, href, placeholder }: FooterLink) {
  if (placeholder) {
    return (
      <span className="whitespace-nowrap text-xs text-text-subtle" aria-disabled="true">
        {label}
      </span>
    )
  }

  if (to) {
    return (
      <Link to={to} className={linkClassName}>
        {label}
      </Link>
    )
  }

  if (href) {
    const external = href.startsWith('http')
    return (
      <a
        href={href}
        className={linkClassName}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
      </a>
    )
  }

  return <span className="whitespace-nowrap text-xs text-text-subtle">{label}</span>
}
