import { cn } from '#/lib/utils.ts'

/**
 * The mark. One component rather than four copies of an <img> tag, so the
 * asset path, the alt text and the sizing rule live in one place.
 *
 * Decorative in every caller — the wordmark beside it carries the name — so
 * the alt stays empty and the element is hidden from the accessibility tree.
 *
 * The artwork is a transparent cut-out that BLEEDS: the character runs off
 * the left and bottom of its own frame. It is cropped to exactly that
 * bounding box, so it fills the box it is given; do not pad it, or it starts
 * floating off-centre.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/logo64.png"
      alt=""
      aria-hidden="true"
      className={cn('shrink-0 object-contain', className)}
    />
  )
}
