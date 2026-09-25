import { cn } from '#/lib/utils.ts'

// Profile picture or the name's initial in a tinted circle. `image` is either
// an uploaded avatar (/api/avatar/$userId?v=) or the Google picture URL.
export function Avatar({
  name,
  image,
  className,
}: {
  name: string
  image?: string | null
  className?: string
}) {
  return image ? (
    <img
      src={image}
      alt=""
      className={cn(
        'size-10 rounded-full border bg-background object-cover',
        className,
      )}
      referrerPolicy="no-referrer"
    />
  ) : (
    <div
      className={cn(
        'flex size-10 items-center justify-center rounded-full border bg-background font-semibold',
        className,
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}
