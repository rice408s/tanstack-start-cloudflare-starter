import { cn } from '@/lib/utils'

// Post covers ship in the repo under public/covers/<key>.webp rather than the
// marketing media bucket: a post is content, and its picture belongs in the
// same commit as the words. The template's covers are Unsplash photos
// (via picsum.photos), free to use — replace them with your own.
export const coverPath = (key: string) => `/covers/${key}.webp`

export function Cover({
  cover,
  alt,
  className,
  eager,
}: {
  cover: string
  alt: string
  className?: string
  eager?: boolean
}) {
  return (
    <div className={cn('overflow-hidden rounded-2xl bg-media', className)}>
      <img
        src={coverPath(cover)}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
    </div>
  )
}
