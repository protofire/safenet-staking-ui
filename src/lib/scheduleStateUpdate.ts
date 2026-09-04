export function scheduleStateUpdate(update: () => void, delayMs = 0): () => void {
  if (delayMs <= 0) {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) update()
    })
    return () => {
      cancelled = true
    }
  }
  const timeoutId = setTimeout(update, delayMs)
  return () => clearTimeout(timeoutId)
}
