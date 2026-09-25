// Notification sink registry. Features that persist notifications register
// via a side-effect import. Deleting a feature = remove its line here; with
// no sinks `notify()` is a no-op. (`export {}` keeps this a module.)

export {}
