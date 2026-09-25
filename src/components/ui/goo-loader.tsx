import { useId } from 'react'

// Indeterminate "gooey" spinner: two blobs merged by an SVG blur+contrast
// filter (.goo-loader in styles.css drives the motion). The filter id must be
// unique per instance, hence useId — two loaders on a page would otherwise
// share, and fight over, one filter.
export function GooLoader() {
  const id = useId()
  return (
    <span className="text-primary">
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
        </filter>
      </svg>
      <span className="goo-loader block" style={{ filter: `url(#${id})` }} />
    </span>
  )
}
