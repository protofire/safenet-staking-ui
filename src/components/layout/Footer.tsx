import { APP_BRAND_NAME, APP_COPYRIGHT } from '@/config/app'
import { cn } from '@/lib/utils'

import {
  buildFooterColumns,
  LEGAL_LINKS,
  MOBILE_FOOTER_BAR_LINKS,
  RESOURCE_LINKS,
} from './footer/constants'
import { FooterBrand } from './footer/FooterBrand'
import { FooterCopyright } from './footer/FooterCopyright'
import { FooterColumns } from './footer/FooterColumns'
import { FooterLegalNav } from './footer/FooterLegalNav'
import { FooterMeta } from './footer/FooterMeta'
import type { FooterColumn } from './footer/types'

const DEFAULT_DESCRIPTION =
  'A non-custodial interface for delegating SAFE to curated validators.'

interface FooterProps {
  brandName?: string
  description?: string
  columns?: FooterColumn[]
  copyright?: string
  className?: string
}

export function Footer({
  brandName = APP_BRAND_NAME,
  description = DEFAULT_DESCRIPTION,
  columns: columnsProp,
  copyright = APP_COPYRIGHT,
  className,
}: FooterProps) {
  const columns = columnsProp ?? buildFooterColumns()

  return (
    <footer className={cn('border-t border-border bg-bg-sunken pb-mobile-tab-bar', className)}>
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-7 pb-8 pt-10 md:grid-cols-[1.3fr_2fr] md:gap-14">
        <FooterBrand brandName={brandName} description={description} />
        <FooterColumns columns={columns} />
      </div>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-7 sm:py-[18px]">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <FooterCopyright copyright={copyright} />
            <FooterMeta className="shrink-0 sm:hidden" />
          </div>
        </div>
        <FooterMeta className="hidden shrink-0 sm:block" />
      </div>
    </footer>
  )
}

export function FooterBar({
  copyright = APP_COPYRIGHT,
  legal = LEGAL_LINKS,
  className,
}: {
  copyright?: string
  legal?: typeof LEGAL_LINKS
  className?: string
}) {
  return (
    <footer className={cn('border-t border-border bg-bg pb-mobile-tab-bar', className)}>
      <div className="mx-auto max-w-[1180px] px-4 py-3 sm:px-7 sm:py-4">
        <div className="flex flex-col gap-4 sm:hidden">
          <div className="flex items-start justify-between gap-3">
            <FooterCopyright copyright={copyright} stacked className="min-w-0" />
            <FooterMeta className="shrink-0" />
          </div>
          <FooterLegalNav
            links={MOBILE_FOOTER_BAR_LINKS}
            className="flex-wrap justify-center gap-x-4 gap-y-2"
          />
        </div>

        <div className="hidden items-center justify-between gap-6 text-[11px] leading-none sm:flex">
          <div className="flex min-w-0 items-center gap-4">
            <FooterCopyright copyright={copyright} className="shrink-0" />
            <span className="h-3.5 w-px shrink-0 bg-border" aria-hidden="true" />
            <FooterLegalNav links={[...RESOURCE_LINKS, ...legal]} />
          </div>
          <FooterMeta className="shrink-0" />
        </div>
      </div>
    </footer>
  )
}
