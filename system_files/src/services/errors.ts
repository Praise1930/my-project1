// MamaTrack GPS — Error normalisation helpers
//
// Values thrown in JavaScript are `unknown`, not `Error`, so reaching for
// `err.message` directly is unsafe. These helpers narrow a caught value down to
// something that can be shown to a user or written to the console.

/** Best-effort human-readable message for any caught value. */
export function errorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
