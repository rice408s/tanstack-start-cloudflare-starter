// Analytics sink registry. Features that forward events register via a
// side-effect import. Deleting a feature = remove its line here; with no
// sinks `track()` is a no-op. (`export {}` keeps this a module when empty.)

export {}
