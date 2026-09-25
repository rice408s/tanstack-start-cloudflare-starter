// Scheduled-job registry. Each feature with maintenance work registers
// itself via a side-effect import. Deleting a feature = remove its line here.
import '@/features/auth/server/jobs'
