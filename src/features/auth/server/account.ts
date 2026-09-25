import { onBeforeAccountDelete } from '@/core/account/events'
import { getBindings } from '@/core/server/cf'
import { avatarKey } from '../avatar'

// The uploaded avatar lives in R2 (not a DB row), so it doesn't cascade.
onBeforeAccountDelete(async (user) => {
  await getBindings().BUCKET.delete(avatarKey(user.id))
})
