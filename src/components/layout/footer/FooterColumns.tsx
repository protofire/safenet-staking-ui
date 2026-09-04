import type { FooterColumn } from './types'
import { FooterLinkItem } from './FooterLinkItem'

export function FooterColumns({ columns }: { columns: FooterColumn[] }) {
  return (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
      {columns.map((col) => (
        <div key={col.head} className="flex flex-col gap-3.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-subtle">
            {col.head}
          </div>
          <nav className="flex flex-col gap-[11px]" aria-label={col.head}>
            {col.links.map((link) => (
              <FooterLinkItem key={link.label} {...link} />
            ))}
          </nav>
        </div>
      ))}
    </div>
  )
}
