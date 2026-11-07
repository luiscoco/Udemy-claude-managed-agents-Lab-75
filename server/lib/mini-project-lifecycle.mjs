// An IPC disconnect also fires when the course dev server is replaced on Windows.
// Keep owned project processes from surviving their launcher.
if (process.send) process.once('disconnect', () => {
  const drain = globalThis[Symbol.for('managed.milestone.shutdown')];
  void Promise.resolve(drain?.()).finally(() => process.exit(0));
});
