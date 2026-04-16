import { useThemeStore } from '@/store/theme'

export function useChartTheme(): { textColor: string; gridColor: string; isDark: boolean } {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  return {
    isDark,
    textColor: isDark ? '#94A3B8' : '#475569',
    gridColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  }
}
