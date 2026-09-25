import { Suspense, use } from 'react'
import { Clip } from '@/components/marketing/media'
import type { MdxModule } from './mdx'

// A clip inside prose: the shared Clip, sized like a tall figure and
// pulled out of the prose spacing so the wrapper's margins apply.
function ProseClip(props: { poster: string; src: string; alt?: string }) {
  return (
    <Clip
      {...props}
      className="not-prose my-8 aspect-[9/16] h-[32rem] rounded-3xl"
    />
  )
}

// A wide table scrolls inside its own box instead of pushing the page
// sideways on a phone.
function ProseTable(props: React.ComponentProps<'table'>) {
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  )
}

function Body({ load }: { load: () => Promise<MdxModule> }) {
  const { default: Component } = use(load())
  return <Component components={{ Clip: ProseClip, table: ProseTable }} />
}

/**
 * A page body. `load` is the entry's own (see core/content/mdx.ts); the route
 * loader has normally called it already, so by render time the promise has
 * settled and `use()` returns without suspending. The boundary is for the
 * one case where it has not — hydrating a server-rendered page before the
 * chunk arrives — and there React keeps the server's HTML in place until it
 * does, so the fallback never shows.
 */
export function MDXContent({ load }: { load: () => Promise<MdxModule> }) {
  return (
    <div className="prose prose-neutral prose-lg dark:prose-invert max-w-none">
      <Suspense fallback={null}>
        <Body load={load} />
      </Suspense>
    </div>
  )
}
