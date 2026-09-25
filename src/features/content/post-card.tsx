import { Link } from '@tanstack/react-router'
import { categoryLabel } from './category'
import type { posts } from './collections'
import { Cover } from './cover'

type Post = (typeof posts)[number]

// One post as a card: cover, category and date, title, summary. The blog
// index lays these out in a grid, and a post lists the others the same way.
export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex flex-col gap-3"
    >
      <Cover
        cover={post.cover}
        alt={post.title}
        className="mb-2 aspect-[16/10]"
      />
      <p className="kicker">
        {categoryLabel[post.category]()}
        <span className="font-normal tracking-normal normal-case">
          {' / '}
          {post.date}
        </span>
      </p>
      <h2 className="text-xl font-medium leading-snug tracking-[-0.01em]">
        {post.title}
      </h2>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {post.description}
      </p>
    </Link>
  )
}
