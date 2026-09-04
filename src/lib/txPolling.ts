export const CALLS_POLL_SCHEDULE = [
  { untilMs: 60_000, intervalMs: 2_000 },
  { untilMs: 5 * 60_000, intervalMs: 5_000 },
] as const

export const CALLS_POLL_MAX_INTERVAL_MS = 10_000

export function callsPollInterval(elapsedMs: number): number {
  for (const step of CALLS_POLL_SCHEDULE) {
    if (elapsedMs < step.untilMs) return step.intervalMs
  }
  return CALLS_POLL_MAX_INTERVAL_MS
}
