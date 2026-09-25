import { useEffect, useRef, useState } from 'react'
import { appConfig } from '@/config/app-config'

// Marketing frames live in the media bucket under their own top-level
// `marketing/` prefix, so a sweep of any other tree can never take a page's
// images with it. Keys are never overwritten: the CDN caches a miss, so a key
// that was ever requested before it existed has to be retired, not refilled.
// `scripts/upload-marketing.ts` publishes to this prefix.
export const MEDIA = `${appConfig.mediaUrl}/marketing`

// Until a bucket is configured (appConfig.mediaUrl), every frame renders as
// its own empty tint rather than a broken image: a fresh clone of the
// template has no assets, and a landing page full of broken-image icons is a
// worse first impression than a page of quiet placeholders. Set mediaUrl and
// the same markup starts serving real files.
const CONFIGURED = Boolean(appConfig.mediaUrl)

// `alt` is omitted for decorative strips (aria-hidden by the caller); every
// frame that stands for something names it.
export function Frame({
  src,
  alt = '',
  className = '',
  eager,
  fit = '',
  style,
}: {
  src: string
  alt?: string
  className?: string
  eager?: boolean
  /** object-position utility when the picture's shape differs from the frame's. */
  fit?: string
  style?: React.CSSProperties
}) {
  if (!CONFIGURED) {
    return (
      <div
        className={`overflow-hidden rounded-2xl bg-media ${className}`}
        style={style}
      />
    )
  }
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-media ${className}`}
      style={style}
    >
      <img
        src={`${MEDIA}/${src}.webp`}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
        className={`size-full object-cover ${fit}`}
      />
    </div>
  )
}

// When a clip's bytes may start: the mp4 is not written to the <video>
// until then. Chrome downloads an autoplaying clip in full whatever
// `preload` says, so a page with twenty clips mounted would pull them all
// on load — the whole marquee, the sections a screen below, the clips the
// reel has not reached. A clip below the fold waits until it is about to
// scroll into view; the fold's own clip waits for the load event so the
// poster (the LCP image), fonts and scripts are not sharing the pipe with
// two megabytes of video.
function useClipReady(
  el: React.RefObject<HTMLElement | null>,
  eager: boolean | undefined,
  src: string | undefined,
) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!src || ready) return
    if (eager) {
      if (document.readyState === 'complete') {
        setReady(true)
        return
      }
      const on = () => setReady(true)
      window.addEventListener('load', on)
      return () => window.removeEventListener('load', on)
    }
    const node = el.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setReady(true)
      },
      { rootMargin: '25% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [el, eager, src, ready])
  return ready && src ? src : undefined
}

// A video slot. Without `src` the poster stands in — the frame keeps its
// place so the layout reads the way it will when the clip lands. With it:
// muted, inline, autoplay, looping unless the caller wants to know when it
// ends — paused on mount for readers who asked the OS for reduced motion,
// since the attribute alone cannot honor that. The clip's bytes are gated
// by `useClipReady`; the server renders the poster alone.
export function Clip({
  poster,
  src,
  alt = '',
  className = '',
  eager,
  style,
  onEnded,
  progressBar,
}: {
  poster: string
  src?: string
  alt?: string
  className?: string
  eager?: boolean
  style?: React.CSSProperties
  /** Play once and report the end instead of looping. */
  onEnded?: () => void
  /**
   * An element whose `scaleX` tracks playback, 0–1. Written straight to the
   * DOM every animation frame while the clip plays — `timeupdate` only fires
   * a few times a second, which reads as a stutter on a bar this wide, and a
   * state update per frame would re-render the caller for something only
   * the clip cares about.
   */
  progressBar?: React.RefObject<HTMLSpanElement | null>
}) {
  const video = useRef<HTMLVideoElement>(null)
  const ready = useClipReady(video, eager, CONFIGURED ? src : undefined)
  useEffect(() => {
    if (!ready) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.current?.pause()
    }
  }, [ready])
  useEffect(() => {
    const el = video.current
    if (!el || !progressBar) return
    let frame = 0
    const tick = () => {
      const bar = progressBar.current
      if (bar && el.duration > 0) {
        bar.style.transform = `scaleX(${el.currentTime / el.duration})`
      }
      frame = requestAnimationFrame(tick)
    }
    const start = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(tick)
    }
    const stop = () => cancelAnimationFrame(frame)
    el.addEventListener('playing', start)
    el.addEventListener('pause', stop)
    el.addEventListener('ended', stop)
    if (!el.paused) start()
    return () => {
      stop()
      el.removeEventListener('playing', start)
      el.removeEventListener('pause', stop)
      el.removeEventListener('ended', stop)
    }
  }, [progressBar])
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-media ${className}`}
      style={style}
    >
      {!CONFIGURED ? null : src ? (
        <video
          ref={video}
          src={ready ? `${MEDIA}/${ready}.mp4` : undefined}
          poster={`${MEDIA}/${poster}.webp`}
          muted
          loop={!onEnded}
          playsInline
          autoPlay
          preload={eager ? 'auto' : 'metadata'}
          aria-label={alt || undefined}
          className="size-full object-cover"
          onEnded={onEnded}
        />
      ) : (
        <img
          src={`${MEDIA}/${poster}.webp`}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover"
        />
      )}
    </div>
  )
}
