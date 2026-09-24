import { ChevronDown, Search } from 'lucide-react'
import { useId } from 'react'

import { cn } from '@/lib/utils'
import type { ValidatorSort, ValidatorStatusFilter } from '@/lib/validators'

const SEGMENTS: { id: ValidatorStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
]

const SORTS: { id: ValidatorSort; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'stake-asc', label: 'Total stake · low to high' },
  { id: 'stake-desc', label: 'Total stake · high to low' },
]

interface ValidatorFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  filter: ValidatorStatusFilter
  onFilterChange: (filter: ValidatorStatusFilter) => void
  sort: ValidatorSort
  onSortChange: (sort: ValidatorSort) => void
  className?: string
}

function SortControl({
  sort,
  onSortChange,
  compact = false,
}: {
  sort: ValidatorSort
  onSortChange: (sort: ValidatorSort) => void
  compact?: boolean
}) {
  const sortId = useId()

  return (
    <label
      htmlFor={sortId}
      className={cn(
        'relative flex h-[38px] shrink-0 items-center rounded-md border border-input-border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
        compact
          ? 'gap-1 bg-surface px-3 hover:bg-surface-hover'
          : 'bg-bg-sunken hover:bg-surface-hover',
      )}
    >
      {!compact && <span className="eyebrow pl-3 pr-2 text-text-subtle">Sort</span>}
      {compact && <span className="text-sm font-medium text-text">Sort</span>}
      <select
        id={sortId}
        value={sort}
        onChange={(e) => onSortChange(e.target.value as ValidatorSort)}
        aria-label="Sort validators"
        className={cn(
          'cursor-pointer appearance-none border-0 bg-transparent text-sm text-text outline-none',
          compact ? 'absolute inset-0 opacity-0' : 'h-[36px] pr-8 pl-0',
        )}
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          'size-3 text-text-muted',
          compact ? 'pointer-events-none' : 'pointer-events-none absolute right-3',
        )}
        aria-hidden
      />
    </label>
  )
}

export function ValidatorFilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  className,
}: ValidatorFilterBarProps) {
  const searchId = useId()

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2 md:hidden">
        <label
          htmlFor={`${searchId}-mobile`}
          className="flex h-[38px] min-w-0 flex-1 items-center gap-2.5 rounded-md border border-input-border bg-bg-sunken px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
        >
          <Search className="size-3.5 shrink-0 text-text-subtle" aria-hidden />
          <input
            id={`${searchId}-mobile`}
            type="search"
            placeholder="Search by name or address"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 border-0 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
          />
        </label>
        <SortControl sort={sort} onSortChange={onSortChange} compact />
      </div>

      <div className="hidden flex-wrap items-center gap-2 md:flex">
        <label
          htmlFor={`${searchId}-desktop`}
          className="flex h-[38px] min-w-[min(100%,280px)] flex-1 items-center gap-2.5 rounded-md border border-input-border bg-bg-sunken px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
        >
          <Search className="size-3.5 shrink-0 text-text-subtle" aria-hidden />
          <input
            id={`${searchId}-desktop`}
            type="search"
            placeholder="Search by name or address…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 border-0 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
          />
        </label>

        <div
          role="radiogroup"
          aria-label="Validator status"
          className="flex h-[38px] overflow-hidden rounded-md border border-border bg-bg-sunken"
        >
          {SEGMENTS.map((seg, i) => {
            const selected = filter === seg.id
            return (
              <button
                key={seg.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onFilterChange(seg.id)}
                className={cn(
                  'px-3.5 text-sm font-medium transition-colors',
                  i > 0 && 'border-l border-border',
                  selected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-transparent text-text-muted hover:text-text',
                )}
              >
                {seg.label}
              </button>
            )
          })}
        </div>

        <SortControl sort={sort} onSortChange={onSortChange} />
      </div>
    </div>
  )
}
