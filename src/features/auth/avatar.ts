// Uploaded avatars: one R2 object per user, served from /api/avatar/$userId.
// `user.image` holds the versioned URL (or Google's picture URL for users
// who never uploaded one).
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]
export const avatarKey = (userId: string) => `avatars/${userId}`
export const avatarUrl = (userId: string, version: number) =>
  `/api/avatar/${userId}?v=${version}`
