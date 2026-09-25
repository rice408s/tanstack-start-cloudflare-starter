// Account-lifecycle handler registry (deletion guards/cleanup + data export).
// Each feature registers itself via a side-effect import. Deleting a feature
// = remove its line here.
import '@/features/auth/server/account'
