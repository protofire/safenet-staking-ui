import { AddressMono } from '@/components/ui/address-mono'
import { Button } from '@/components/ui/button'
import { TableHead } from '@/components/ui/table'
import { formatPercent, formatTokenAmount } from '@/lib/format'
import type { PositionRow } from '@/lib/portfolio'

const numericCell = 'w-px whitespace-nowrap px-5 py-3 text-right font-mono text-xs tabular-nums'

export function StakePositionsCard({
  positions,
  onUnstake,
}: {
  positions: PositionRow[]
  onUnstake: (address: `0x${string}`) => void
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <h2>Validators with your stake</h2>
      </div>
      <ul className="divide-y divide-border md:hidden">
        {positions.map((p, idx) => (
          <li key={p.address} className="px-4 py-4">
            <p className="font-mono text-xs tabular-nums text-text-muted">
              {String(idx + 1).padStart(2, '0')}
            </p>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="shrink-0 text-sm font-medium text-text">{p.label}</span>
              <AddressMono value={p.address} compact truncated />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs lg:text-sm">
              <dt className="text-text-muted">Tokens</dt>
              <dd className="text-right font-mono tabular-nums text-text">
                {formatTokenAmount(p.stake)} SAFE
              </dd>
              <dt className="text-text-muted">Commission</dt>
              <dd className="text-right font-mono tabular-nums text-text-muted">
                {formatPercent(p.commissionPct, 1)}
              </dd>
              <dt className="text-text-muted">Part. 14d</dt>
              <dd className="text-right font-mono tabular-nums text-text-muted">
                {formatPercent(p.participationPct)}
              </dd>
            </dl>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 h-10 w-full font-medium"
              onClick={() => onUnstake(p.address)}
            >
              Unstake
            </Button>
          </li>
        ))}
      </ul>
      <div className="hidden min-w-0 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-sunken">
              <TableHead className="w-10 text-left">#</TableHead>
              <TableHead className="w-[1%] text-left">Validator</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="w-px whitespace-nowrap text-right">Commission</TableHead>
              <TableHead className="w-px whitespace-nowrap text-right">Part. 14d</TableHead>
              <TableHead className="w-px whitespace-nowrap">
                <span className="sr-only">Actions</span>
              </TableHead>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, idx) => {
              const tokensLabel = formatTokenAmount(p.stake)
              return (
                <tr
                  key={p.address}
                  className="border-b border-border-faint transition-colors hover:bg-surface-hover"
                >
                  <td className="px-5 py-3 font-mono text-xs tabular-nums text-text-muted">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium text-text">{p.label}</span>
                      <AddressMono value={p.address} compact truncated />
                    </div>
                  </td>
                  <td
                    className="whitespace-nowrap px-5 py-3 text-right font-mono text-xs tabular-nums text-text"
                    aria-label={`${tokensLabel} SAFE staked`}
                  >
                    <span className="whitespace-nowrap">{tokensLabel}</span>
                    <span className="ml-1 font-normal text-text-muted">SAFE</span>
                  </td>
                  <td className={`${numericCell} text-text-muted`}>
                    {formatPercent(p.commissionPct, 1)}
                  </td>
                  <td className={`${numericCell} text-text-muted`}>
                    {formatPercent(p.participationPct)}
                  </td>
                  <td className="w-px whitespace-nowrap px-5 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="font-mono text-sm font-medium"
                      onClick={() => onUnstake(p.address)}
                    >
                      Unstake
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
