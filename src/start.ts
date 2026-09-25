import { createStart } from '@tanstack/react-start'

// Global Start configuration: register request/function middleware here
// (e.g. logging, rate limiting) and global SSR defaults. Marketing routes
// render on the server; _app opts down to ssr: 'data-only' per-route.
export const startInstance = createStart(() => ({
  defaultSsr: true,
}))
