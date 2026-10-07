import { formatTokenAmount } from '@/lib/format'
import { conicGradientFromSegments, stakeSharePct, type PositionRow } from '@/lib/portfolio'

export function StakeDistributionCard({
  positions,
  total,
}: {
  positions: PositionRow[]
  total: bigint
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <h2>Stake distribution</h2>
        <span className="eyebrow">{positions.length} validators</span>
      </div>
      <div className="flex flex-col items-center gap-5 px-4 py-6">
        {total <= 0n || positions.length === 0 ? (
          <div
            className="flex size-[188px] shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted/30 font-mono text-xs text-text-muted"
            aria-hidden
          >
            —
          </div>
        ) : (
          <div className="relative size-[188px] shrink-0">
            <div
              className="size-full rounded-full"
              style={{ background: conicGradientFromSegments(positions, total) }}
              aria-hidden
            />
            <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-card">
              <span className="font-mono text-xs tabular-nums text-text-muted">
                {positions.length}
              </span>
            </div>
          </div>
        )}
        <ul className="w-full space-y-3 sm:space-y-2">
          {positions.map((p) => (
            <li key={p.address} className="flex items-center gap-2.5 text-sm">
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ background: p.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate font-medium text-text">{p.label}</span>
              <span className="font-mono text-xs tabular-nums text-text-muted">
                {formatTokenAmount(p.stake)}
              </span>
              <span className="w-12 text-right font-mono text-xs tabular-nums text-text-muted">
                {stakeSharePct(p.stake, total).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
