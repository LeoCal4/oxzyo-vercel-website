'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export function ThemeToggle({ className }: Props) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label={resolvedTheme === 'dark' ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
      className={cn('p-1.5 rounded-md hover:bg-white/10 transition-colors', className)}
    >
      {/* Icon swap via CSS — avoids mounted-state flicker */}
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="h-4 w-4 hidden dark:block" />
    </button>
  )
}
