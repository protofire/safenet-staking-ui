const BRAND_HUE = 62

export type ChartTheme = 'light' | 'dark'

const BRAND_SEGMENT = 'var(--brand)'

const CHART_L_C: Record<ChartTheme, { l: number; c: number }> = {
  light: { l: 0.7, c: 0.23 },
  dark: { l: 0.82, c: 0.22 },
}

export function chartSegmentColor(index: number, count: number, theme: ChartTheme): string {
  if (index === 0) return BRAND_SEGMENT

  const safeCount = Math.max(1, count)
  const { l, c } = CHART_L_C[theme]
  const hue = (BRAND_HUE + (index * 360) / safeCount) % 360
  return `oklch(${l} ${c} ${hue.toFixed(2)})`
}
