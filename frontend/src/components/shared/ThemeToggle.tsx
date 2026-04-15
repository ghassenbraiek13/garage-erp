import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  const isDark = theme === 'dark'
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="relative rounded-full"
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      onClick={() => toggle()}
    >
      <Sun
        className={cn('h-5 w-5 transition-all', isDark ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}
        aria-hidden
      />
      <Moon
        className={cn(
          'absolute h-5 w-5 transition-all',
          isDark ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
        )}
        aria-hidden
      />
    </Button>
  )
}
