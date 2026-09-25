// Email event sink registry. Features that persist delivery events register
// via a side-effect import. Deleting a feature = remove its line here; with
// no sinks `emitEmailEvent()` is a no-op. (`export {}` keeps this a module.)

export {}
