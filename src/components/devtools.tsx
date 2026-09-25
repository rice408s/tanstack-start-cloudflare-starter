import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

// Dev-only: __root.tsx lazy-imports this module behind import.meta.env.DEV,
// so production client bundles never contain the devtools packages.
export default function Devtools() {
  return (
    // Hidden by default — the floating trigger only appears with
    // ?tanstack-devtools in the URL (or Ctrl+~).
    <TanStackDevtools
      config={{
        position: 'bottom-right',
        requireUrlFlag: true,
      }}
      plugins={[
        {
          name: 'Tanstack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
        TanStackQueryDevtools,
      ]}
    />
  )
}
