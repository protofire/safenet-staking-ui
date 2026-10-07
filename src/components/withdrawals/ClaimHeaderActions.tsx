import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ClaimHeaderActionsProps = {
  maturePrefix: number
  prefersBatchClaim: boolean
  batchDisabled: boolean
  singleDisabled: boolean
  onClaim: (mode: 'single' | 'batch') => void
}

export function ClaimHeaderActions({
  maturePrefix,
  prefersBatchClaim,
  batchDisabled,
  singleDisabled,
  onClaim,
}: ClaimHeaderActionsProps) {
  return (
    <>
      {prefersBatchClaim ? (
        <Button
          type="button"
          variant="default"
          className="h-11 w-full px-5 text-sm font-semibold tracking-tight md:w-auto"
          disabled={batchDisabled}
          onClick={() => onClaim('batch')}
        >
          Claim {maturePrefix} withdrawals
        </Button>
      ) : (
        <Button
          type="button"
          variant={maturePrefix > 0 ? 'default' : 'secondary'}
          className={cn(
            'h-11 w-full px-5 text-sm font-semibold tracking-tight md:w-auto',
            maturePrefix === 0 && 'pointer-events-none opacity-60',
          )}
          disabled={singleDisabled}
          onClick={() => onClaim('single')}
        >
          {maturePrefix > 0 ? 'Claim withdrawal' : 'No matured withdrawals'}
        </Button>
      )}
      {prefersBatchClaim && <span className="eyebrow">Batch EIP-5792 supported</span>}
    </>
  )
}
