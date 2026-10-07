import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'

export function WithdrawalQueueEmpty({ cooldownPhrase }: { cooldownPhrase: string | null }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center md:py-14">
      <p className="text-sm font-semibold text-text">Your withdrawal queue is empty.</p>
      <p className="mt-6 max-w-prose text-center text-base text-balance text-text-muted">
        Initiate a withdrawal from any validator to start the cooldown
        {cooldownPhrase ? ` (about ${cooldownPhrase})` : ''}.
      </p>
      <Button type="button" className="mt-6 font-semibold" onClick={() => navigate('/validators')}>
        Explore validators
      </Button>
    </div>
  )
}
