import { type ReactNode, type TouchEvent, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  snapPoints?: (string | number)[]
  initialSnap?: number
  dismissible?: boolean
  safeAreaBottom?: boolean
  className?: string
}

const DRAG_DISMISS_PX = 60

export function BottomSheet({
  open,
  onOpenChange,
  children,
  snapPoints = ['auto', '90vh'],
  initialSnap = 0,
  dismissible = true,
  safeAreaBottom = true,
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const snap = initialSnap
  const [dragY, setDragY] = useState(0)
  const startY = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    sheetRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused.current?.focus?.()
    }
  }, [open, dismissible, onOpenChange])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    startY.current = t.clientY
  }
  const onTouchMove = (e: TouchEvent) => {
    if (startY.current == null) return
    const t = e.touches[0]
    if (!t) return
    const dy = t.clientY - startY.current
    if (dy > 0) setDragY(dy)
  }
  const onTouchEnd = () => {
    if (dragY > DRAG_DISMISS_PX && dismissible) onOpenChange(false)
    setDragY(0)
    startY.current = null
  }

  const height = snapPoints[snap] ?? snapPoints[0]

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close sheet"
        onClick={() => dismissible && onOpenChange(false)}
        className="absolute inset-0 bg-black/55"
        tabIndex={-1}
      />
      <div
        ref={sheetRef}
        tabIndex={-1}
        style={{
          height,
          transform: `translateY(${dragY}px)`,
        }}
        className={cn(
          'absolute right-0 bottom-0 left-0',
          'flex flex-col',
          'rounded-t-2xl border-t border-border-strong bg-surface-raised shadow-modal',
          dragY === 0 ? 'transition-transform duration-220 ease-sheet' : 'transition-none',
          'motion-reduce:transition-none',
          safeAreaBottom && 'pb-safe-4',
          className,
        )}
      >
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="flex cursor-grab justify-center pt-2 pb-1 active:cursor-grabbing"
          aria-hidden
        >
          <div className="h-1 w-9 rounded-full bg-border-strong" />
        </div>
        {children}
      </div>
    </div>
  )
}
