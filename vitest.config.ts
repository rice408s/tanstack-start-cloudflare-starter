import { fileURLToPath } from 'node:url'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Deliberately not vite.config.ts: the app's Vite config wires the Cloudflare,
// TanStack Start, and Paraglide plugins, which expect a workerd runtime and
// build-time codegen. Unit tests just need React + the `@/`/`#/` path aliases.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // Only workerd has it. Database tests fill this stand-in's `env` with a
    // Miniflare D1 (src/test/d1.ts); everything else never touches it.
    alias: {
      'cloudflare:workers': fileURLToPath(
        new URL('./src/test/cloudflare-workers.ts', import.meta.url),
      ),
    },
  },
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Playwright owns e2e/ (bun run e2e); *.spec.ts there are not vitest.
    // .claude/ holds session worktrees — full repo copies vitest must not scan.
    // agent/ is its own package and runs its tests with `bun test`.
    exclude: ['**/node_modules/**', 'e2e/**', '.claude/**', 'agent/**'],
  },
})
