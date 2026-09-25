import { useEffect, useState } from 'react'
import type { Heading } from '@/core/content/remark-headings'
import { cn } from '@/lib/utils'
import { m } from '@/paraglide/messages'

/**
 * The post's `##`/`###` headings as a sticky list beside the article, with
 * the section being read marked. The list comes from the compiled MDX (see
 * core/content/remark-headings.ts), so it is in the prerendered HTML; only
 * the "you are here" mark needs JavaScript.
 */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const targets = headings
      .map((h) => document.getElementById(h.id))
      .filter((el) => el !== null)
    if (targets.length === 0) return
    // The current section is the last heading that has scrolled past a line
    // a little below the sticky header.
    const update = () => {
      let current: string | null = null
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= 120) current = el.id
        else break
      }
      setActive(current ?? targets[0]?.id ?? null)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [headings])

  if (headings.length < 2) return null

  return (
    <nav aria-label={m.blog_toc()} className="flex flex-col gap-3">
      <p className="kicker">{m.blog_toc()}</p>
      <ul className="flex flex-col gap-0.5">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? 'location' : undefined}
              className={cn(
                // The docs sidebar's selected state: a tinted fill, no rule.
                'block rounded-lg py-1.5 pr-3 text-sm leading-snug transition-colors',
                h.depth === 3 ? 'pl-6' : 'pl-3',
                active === h.id
                  ? // No bolder weight: a heavier word can wrap onto another
                    // line and make the whole list jump.
                    'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
