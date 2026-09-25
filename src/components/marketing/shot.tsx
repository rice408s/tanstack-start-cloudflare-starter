/**
 * A product screenshot, captured from the real app.
 *
 * The files live in `public/marketing/<key>-{light,dark}.webp` and are
 * COMMITTED, not uploaded. A template gets cloned long before its owner has
 * a media bucket, and a landing page whose images 404 on a fresh clone is
 * worse than one with no images at all. `appConfig.mediaUrl` and
 * `<Frame>`/`<Clip>` (media.tsx) are still there for heavier assets — video,
 * and anything you would rather keep out of git.
 *
 * Regenerate them with `bun run capture:marketing`, which drives the real app
 * against the seeded local database. That is the answer to "screenshots go
 * stale": they are a build artefact you re-run, not a file somebody made by
 * hand once.
 *
 * One <img> per theme, both `loading="lazy"`, the wrong one `display: none`.
 * A lazy image that is not rendered is never requested, so the browser still
 * fetches exactly one file per shot — and, unlike the CSS background this
 * used to be, fetches it when the block scrolls near rather than with the
 * page: these sit four screens down and weigh a quarter of a megabyte
 * together. The theme class is on <html> before first paint, so there is no
 * flash of the other theme. The wrapper holds the 16:10 box, so nothing
 * shifts when the file lands.
 */
export function Shot({
  name,
  alt,
  className = '',
}: {
  /** Filename stem under public/marketing — `app` reads `app-light.webp`. */
  name: string
  /**
   * What the screenshot shows. Keep it a description of the SCREEN, not a
   * repeat of the caption sitting next to it.
   */
  alt: string
  className?: string
}) {
  const shared = {
    loading: 'lazy',
    decoding: 'async',
    draggable: false,
  } as const
  return (
    <div
      className={`aspect-[16/10] w-full overflow-hidden rounded-2xl bg-media ${className}`}
    >
      <img
        {...shared}
        alt={alt}
        src={`/marketing/${name}-light.webp`}
        className="size-full object-cover object-top dark:hidden"
      />
      <img
        {...shared}
        alt={alt}
        src={`/marketing/${name}-dark.webp`}
        className="hidden size-full object-cover object-top dark:block"
      />
    </div>
  )
}
