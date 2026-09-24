import { Link } from 'react-router'

import { AppShell } from '@/components/layout/AppShell'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function infoStatShellClass() {
  return 'flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-card px-4 py-4 sm:px-5'
}

function InfoStatSkeleton() {
  return (
    <div className={infoStatShellClass()} aria-hidden>
      <Skeleton className="h-[clamp(0.875rem,3.6vw,1.375rem)] w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function InfoStatSkeletonRow({
  count = 2,
  connected = false,
}: {
  count?: number
  connected?: boolean
}) {
  if (connected) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className={cn(
                infoStatShellClass(),
                'rounded-none border-0 bg-transparent',
                i < count - 1 && 'border-b border-border-faint md:border-b-0',
                i % 2 === 0 && i < count - 1 && 'md:border-r border-border-faint',
                i < 2 && 'md:border-b lg:border-b-0 border-border-faint',
                i < count - 1 && 'lg:border-r border-border-faint',
              )}
              aria-hidden
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-[clamp(0.875rem,3.6vw,1.375rem)] w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <InfoStatSkeleton key={i} />
      ))}
    </>
  )
}

function WithdrawalRowSkeleton({ isLast = false }: { isLast?: boolean }) {
  return (
    <div
      className={cn(
        'border-l-2 border-l-transparent px-4 py-4 md:px-5',
        !isLast && 'border-b border-border-faint',
      )}
      aria-hidden
    >
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-baseline justify-between gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-11 w-full rounded-md" />
      </div>

      <div
        className="hidden items-center gap-5 md:grid"
        style={{
          gridTemplateColumns: '52px minmax(0,1fr) minmax(0,1fr) minmax(0,2fr) 140px',
        }}
      >
        <Skeleton className="h-5 w-8" />
        <Skeleton className="ml-auto h-4 w-24" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="ml-auto h-8 w-[88px] rounded-md" />
      </div>
    </div>
  )
}

export function WithdrawalQueueSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
      aria-busy="true"
      aria-label="Loading withdrawals"
    >
      {Array.from({ length: count }).map((_, i) => (
        <WithdrawalRowSkeleton key={i} isLast={i === count - 1} />
      ))}
    </div>
  )
}

export function InlineAmountSkeleton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <Skeleton
      className={cn(
        'inline-block rounded-sm',
        size === 'sm' && 'h-3 w-14',
        size === 'md' && 'h-4 w-16',
        className,
      )}
      aria-hidden
    />
  )
}

function ValidatorCardSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-hidden>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="mt-2 h-3 w-full max-w-xs" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-10 min-h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 min-h-10 flex-1 rounded-md" />
      </div>
    </div>
  )
}

function ValidatorTableRowSkeleton() {
  return (
    <tr className="border-b border-border-faint" aria-hidden>
      <td className="px-5 py-4">
        <Skeleton className="h-4 w-6" />
      </td>
      <td className="px-5 py-4">
        <Skeleton className="h-4 w-48" />
      </td>
      <td className="px-5 py-4 text-right">
        <Skeleton className="ml-auto h-4 w-12" />
      </td>
      <td className="px-5 py-4 text-right">
        <Skeleton className="ml-auto h-4 w-14" />
      </td>
      <td className="px-5 py-4 text-right">
        <Skeleton className="ml-auto h-4 w-16" />
      </td>
      <td className="px-5 py-4 text-right">
        <Skeleton className="ml-auto h-4 w-14" />
      </td>
      <td className="px-5 py-4 text-right">
        <Skeleton className="ml-auto h-4 w-16" />
      </td>
      <td className="px-5 py-4 text-right">
        <div className="ml-auto flex w-[180px] justify-end gap-2">
          <Skeleton className="h-8 w-[88px]" />
          <Skeleton className="h-8 w-[88px]" />
        </div>
      </td>
    </tr>
  )
}

export function ValidatorMobileSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ValidatorCardSkeleton key={i} />
      ))}
    </>
  )
}

export function ValidatorTableSkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ValidatorTableRowSkeleton key={i} />
      ))}
    </>
  )
}

export function NotFoundPage() {
  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-[540px] flex-1 flex-col justify-center px-6 py-16">
        <h1 className="m-0 font-semibold leading-none tracking-[-0.04em] text-foreground [font-size:clamp(4.5rem,18vw,7.5rem)]">
          404
        </h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground lg:text-[0.9375rem]">
          The page you requested doesn&apos;t exist on this interface. The route may have moved, or
          the link may be malformed.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex w-fit items-center text-sm text-foreground underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          Back to Home
        </Link>
      </main>
    </AppShell>
  )
}
