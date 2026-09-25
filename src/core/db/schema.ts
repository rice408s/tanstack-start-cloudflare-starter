// Barrel of all feature schemas. Deleting a feature = remove its line here,
// then `bun run db:generate` produces the drop migration.
export * from '@/features/auth/schema'
