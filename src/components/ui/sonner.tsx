import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { Toaster as Sonner, type ToasterProps, toast } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  // This Toaster is mounted lazily (routes/__root.tsx), and sonner's only
  // shows toasts raised AFTER it subscribes. Anything raised in the meantime
  // is still in sonner's store, so say it again: re-raising under the same id
  // updates the entry rather than adding one. Runs after the child's own
  // effect, which is where it subscribes.
  useEffect(() => {
    for (const queued of toast.getToasts()) {
      if ('dismiss' in queued) continue
      const { title, ...rest } = queued
      toast(typeof title === 'function' ? title() : title, rest)
    }
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
