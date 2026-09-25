import { env } from 'cloudflare:workers'

// The ONLY file allowed to touch `cloudflare:workers`. It must never be
// imported from client code — the import crashes Vite's client bundle
// (TanStack Router #5208). Server functions and server routes only.
export function getBindings(): Env {
  return env as Env
}
