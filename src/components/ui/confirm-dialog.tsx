import type { ReactNode } from 'react'
import { Button } from '#/components/ui/button.tsx'
import { Dialog, DialogContent, DialogTitle } from '#/components/ui/dialog.tsx'

/**
 * Small centered confirm. Narrower than the base dialog and without its
 * corner close — the two buttons are the only exits, so the choice stays
 * deliberate. Destructive by default (that is what most confirms are); a
 * commit that merely costs money passes `variant="default"`.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  variant = 'destructive',
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  variant?: 'destructive' | 'default'
  /** One optional control between the copy and the buttons — a note field,
   * a typed confirmation. Anything more is a form, not a confirm. */
  children?: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(calc(100vw-2rem),24rem)] gap-0 p-6"
        closeClassName="hidden"
      >
        <DialogTitle className="text-base">{title}</DialogTitle>
        {typeof description === 'string' ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : (
          description
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
