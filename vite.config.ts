import { cloudflare } from '@cloudflare/vite-plugin'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
// [feature: content]
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from 'vite'
import { isPrivatePath } from './src/config/private-paths'
import { mdxMeta } from './src/core/content/mdx-meta-plugin'
import { remarkHeadings } from './src/core/content/remark-headings'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // Local D1/R2 live in .wrangler/state. Watching it turns every database
  // or bucket write into a full page reload — an upload closed the dialog it
  // came from, a filter snapped back mid-click.
  server: { watch: { ignored: ['**/.wrangler/**'] } },
  plugins: [
    devtools(),
    // MDX compiles to real ES modules at build time — no runtime eval,
    // which workerd forbids. [feature: content]
    {
      ...mdx({
        // Only .mdx — plain .md files (e.g. SKILL.md served via ?raw) stay text.
        include: /\.mdx$/,
        remarkPlugins: [
          remarkFrontmatter,
          remarkMdxFrontmatter,
          remarkGfm,
          // `##`/`###` ids and the `headings` export behind the TOC.
          remarkHeadings,
        ],
      }),
      enforce: 'pre',
    },
    // `*.mdx?meta` — frontmatter without the page body. Core: the legal
    // pages use it too.
    mdxMeta(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      cookieName: 'APP_LOCALE',
      strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
      // en is unprefixed (/pricing), zh is prefixed (/zh/pricing).
      urlPatterns: [
        {
          pattern: '/:path(.*)?',
          localized: [
            ['zh', '/zh/:path(.*)?'],
            ['en', '/:path(.*)?'],
          ],
        },
      ],
    }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      // Marketing pages are prerendered to static HTML at build time and
      // served from Cloudflare's asset layer. App/auth/api routes are
      // excluded — they need a session or bindings at request time.
      prerender: {
        enabled: true,
        crawlLinks: true,
        // Everything behind the session guard is excluded: a prerendered
        // copy would serve without the guard. The list lives in
        // src/config/private-paths.ts, shared with robots.txt.
        //
        // A query string is not a page: `/blog?category=specs` writes the
        // same blog/index.html as `/blog`, and whichever the crawler reaches
        // last wins — which shipped a blog index with no posts on it. The
        // filters narrow the list client-side (routes/_marketing/blog).
        filter: (page) => !page.path.includes('?') && !isPrivatePath(page.path),
      },
      pages: [{ path: '/' }, { path: '/zh/' }],
    }),
    viteReact(),
  ],
  environments: {
    client: {
      build: {
        rolldownOptions: {
          // A message module is a pure function and nothing else. Saying so
          // matters for the grouping below: without it the bundler keeps
          // bare `import './messages-admin'` lines between the groups to
          // preserve an evaluation order nobody depends on, and the console
          // copy is back on every page.
          treeshake: {
            moduleSideEffects: [
              { test: /paraglide\/messages\//, sideEffects: false },
            ],
          },
          output: {
            // Paraglide compiles one module per message, which the bundler is
            // free to tree-shake — and then folds every survivor back into
            // ONE shared chunk, because each message is "common" to some pair
            // of routes. The result was a single file holding the whole
            // app's copy, admin console included, on the landing page's
            // critical path. Message keys carry their area as a prefix, so
            // group them by it: a visitor to `/` fetches the marketing copy,
            // and the console's 300-odd strings load with the console.
            // Anything unlisted stays in the default shared chunk.
            advancedChunks: {
              groups: [
                // First, and on its own: every message imports the runtime
                // (getLocale, and the URLPattern polyfill behind it). Left to
                // chance it is hoisted into whichever group is declared
                // first, and then every page loads that group to get it.
                {
                  name: 'paraglide-runtime',
                  test: /paraglide\/(runtime|registry)\.js|urlpattern-polyfill/,
                  priority: 10,
                },
                {
                  name: 'messages-admin',
                  test: /paraglide\/messages\/admin_/,
                },
                {
                  name: 'messages-marketing',
                  test: /paraglide\/messages\/(marketing|blog|docs|home|footer|seo|legal)_/,
                },
              ],
            },
          },
        },
      },
    },
  },
})

export default config
