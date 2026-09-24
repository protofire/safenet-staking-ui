import type { ReactNode } from 'react'
import type { Hex } from 'viem'

import { SwitchNetworkButton } from '@/components/layout/SwitchNetworkButton'
import { WrongNetworkPrompt } from '@/components/layout/WrongNetworkPrompt'
import { DialogTxProgress } from '@/components/staking/DialogTxProgress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogCloseIcon,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWalletReady } from '@/hooks/useWalletReady'
import { txProgressTitle, type TxProgressPhase } from '@/lib/txProgress'
import { cn } from '@/lib/utils'

export type TxDialogProgress = {
  phase: TxProgressPhase
  txHash?: Hex | undefined
  description?: string | undefined
  children?: ReactNode
}

type TxDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  progress?: TxDialogProgress | null
  progressTitle?: string
  dismissLocked?: boolean
  cancelDisabled?: boolean
  cancelLabel?: string
  actions?: ReactNode
  bodyClassName?: string
  footerClassName?: string
  children: ReactNode
}

export const WRONG_NETWORK_PROMPT_CLASS =
  'rounded-md border border-warning/55 bg-warning-soft px-3.5 py-3 text-sm text-text'

export function TxDialog({
  open,
  onOpenChange,
  title,
  progress = null,
  progressTitle,
  dismissLocked = false,
  cancelDisabled = false,
  cancelLabel = 'Cancel',
  actions,
  bodyClassName,
  footerClassName,
  children,
}: TxDialogProps) {
  const { wrongNetwork } = useWalletReady()

  function handleOpenChange(next: boolean) {
    if (!next && dismissLocked) return
    onOpenChange(next)
  }

  const headerTitle = progress ? (progressTitle ?? txProgressTitle(progress.phase)) : title

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 p-0"
        aria-describedby={undefined}
        showCloseButton={false}
        sheetDismissible={!dismissLocked}
        onPointerDownOutside={(e) => dismissLocked && e.preventDefault()}
        onEscapeKeyDown={(e) => dismissLocked && e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-4 border-b border-border-faint px-5 py-4">
          <DialogTitle className="min-w-0 pr-2 text-base font-semibold tracking-tight text-text">
            {headerTitle}
          </DialogTitle>
          <DialogCloseIcon disabled={dismissLocked} className="shrink-0" />
        </DialogHeader>

        {progress ? (
          <>
            <DialogBody className="py-0">
              <DialogTxProgress
                phase={progress.phase}
                txHash={progress.txHash}
                {...(progress.description !== undefined
                  ? { description: progress.description }
                  : {})}
              />
              {progress.children}
            </DialogBody>
            {progress.phase === 'success' ? (
              <DialogFooter className="sm:justify-end">
                <Button
                  type="button"
                  className="font-semibold"
                  onClick={() => handleOpenChange(false)}
                >
                  Done
                </Button>
              </DialogFooter>
            ) : null}
          </>
        ) : (
          <>
            <DialogBody className={cn('gap-5', bodyClassName)}>
              <WrongNetworkPrompt className={WRONG_NETWORK_PROMPT_CLASS} />
              {children}
            </DialogBody>
            <DialogFooter className={footerClassName}>
              <Button
                type="button"
                variant="ghost"
                className="text-text-muted hover:text-text"
                disabled={cancelDisabled}
                onClick={() => handleOpenChange(false)}
              >
                {cancelLabel}
              </Button>
              {wrongNetwork ? <SwitchNetworkButton /> : actions}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
