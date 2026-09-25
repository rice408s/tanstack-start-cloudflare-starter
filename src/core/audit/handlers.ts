// Audit sink registry. Features that persist/forward audit entries register
// via a side-effect import. Deleting a feature = remove its line here; with
// no sinks `audit()` is a no-op. (`export {}` keeps this a module when empty.)

export {}
