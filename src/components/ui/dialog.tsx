import { Dialog as DialogPrimitive } from 'radix-ui'
import * as React from 'react'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/useBreakpoint'
import { cn } from '@/lib/utils'

const DialogRequestCloseContext = React.createContext<(() => void) | null>(null)

function useDialogRequestClose(): () => void {
  const fn = React.useContext(DialogRequestCloseContext)
  if (!fn) {
    throw new Error('DialogContent must be used within Dialog')
  }
  return fn
}

function Dialog({ onOpenChange, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const requestClose = React.useCallback(() => {
    onOpenChange?.(false)
  }, [onOpenChange])
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      onOpenChange?.(open)
    },
    [onOpenChange],
  )
  return (
    <DialogRequestCloseContext.Provider value={requestClose}>
      <DialogPrimitive.Root data-slot="dialog" {...props} onOpenChange={handleOpenChange} />
    </DialogRequestCloseContext.Provider>
  )
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-background/80 backdrop-blur-[2px] duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  )
}

function DialogCloseIcon({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <DialogPrimitive.Close data-slot="dialog-close-icon" asChild>
      <button
        type="button"
        aria-label="Close dialog"
        className={cn(
          'inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-text-muted hover:bg-surface-hover hover:text-text',
          'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
          className,
        )}
        {...props}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M4 4 L12 12 M12 4 L4 12" />
        </svg>
      </button>
    </DialogPrimitive.Close>
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  sheetDismissible = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  sheetDismissible?: boolean
}) {
  const mobile = useIsMobile()
  const requestClose = useDialogRequestClose()

  if (mobile) {
    return (
      <DialogPortal>
        <BottomSheet
          open
          dismissible={sheetDismissible}
          onOpenChange={(next) => {
            if (!next && sheetDismissible) requestClose()
          }}
        >
          <DialogPrimitive.Content asChild {...props}>
            <div
              data-slot="dialog-content"
              className={cn(
                'relative flex max-h-[min(90vh,calc(100%-env(safe-area-inset-bottom)-2rem))] flex-col overflow-y-auto p-0 text-sm text-foreground outline-none',
                className,
              )}
            >
              {children}
              {showCloseButton ? (
                <div className="sticky bottom-0 z-10 border-t border-border-faint bg-surface px-5 py-3 pb-safe-3">
                  <DialogPrimitive.Close asChild>
                    <Button type="button" variant="outline" className="w-full">
                      Close
                    </Button>
                  </DialogPrimitive.Close>
                </div>
              ) : null}
            </div>
          </DialogPrimitive.Content>
        </BottomSheet>
      </DialogPortal>
    )
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex max-h-[min(90vh,calc(100%-2rem))] w-full max-w-[min(460px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-surface-raised p-4 text-sm text-foreground shadow-modal duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? <DialogCloseIcon className="absolute top-4 right-4" /> : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="dialog-header" className={cn('flex flex-col gap-2', className)} {...props} />
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn('flex flex-col gap-4 px-5 py-5', className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 border-t border-border-faint px-5 py-3',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button type="button" variant="outline">
            Close
          </Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'm-0 font-semibold text-sm leading-none tracking-tight text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogCloseIcon,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
}
