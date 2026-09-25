import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// @testing-library/react only auto-registers this when it detects a global
// `afterEach` (e.g. Jest's globals). Vitest's globals are opt-in and this
// project doesn't enable them, so register cleanup explicitly — otherwise
// each test's rendered tree stays in the DOM and pollutes the next test's
// `screen` queries.
afterEach(() => {
  cleanup()
})
