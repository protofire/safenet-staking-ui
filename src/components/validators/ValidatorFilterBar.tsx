import { ChevronDown, Search } from 'lucide-react'
import { useId } from 'react'

import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  return (
    <Select value={sort} onValueChange={(value) => onSortChange(value as ValidatorSort)}>
      <SelectTrigger
        aria-label="Sort validators"
        className={cn(
          'flex h-[38px] shrink-0 cursor-pointer items-center rounded-md border border-input-border text-sm text-text outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 data-[state=open]:border-ring data-[state=open]:ring-2 data-[state=open]:ring-ring/30',
          compact
            ? 'gap-1 bg-surface px-3 hover:bg-surface-hover'
            : 'gap-2 bg-bg-sunken px-3 hover:bg-surface-hover',
        )}
      >
        {compact ? (
          <span className="font-medium">Sort</span>
        ) : (
          <>
            <span className="eyebrow text-text-subtle">Sort</span>
            <SelectValue />
          </>
        )}
        <SelectIcon asChild>
          <ChevronDown className="size-3 text-text-muted" aria-hidden />
        </SelectIcon>
      </SelectTrigger>
      <SelectContent>
        {SORTS.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
