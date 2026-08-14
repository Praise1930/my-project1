// MamaTrack GPS — Toast and dialog event bus
//
// Kept separate from the components so those files export only components,
// which React Fast Refresh requires, and so any module can raise a toast or ask
// for a confirmation without importing React.

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  title?: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

export const TOAST_EVENT = 'mamatrack_toast';
export const CONFIRM_EVENT = 'mamatrack_confirm';

let nextId = 1;

/**
 * Show a non-blocking toast. Kept out of the render path deliberately: the GPS
 * simulation timers and cross-dashboard polling must not stall behind a modal.
 */
export function showToast(
  message: string,
  variant: ToastVariant = 'info',
  durationMs = 5000,
  title?: string,
) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastItem>(TOAST_EVENT, {
    detail: { id: nextId++, title, message, variant, durationMs },
  }));
}

export type ConfirmTone = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

export interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: (confirmed: boolean) => void;
}

/**
 * Ask the user to confirm an action. Replaces window.confirm, which blocks the
 * event loop, cannot be themed, and shows the origin to the user.
 */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent<ConfirmRequest>(CONFIRM_EVENT, {
      detail: { ...options, id: nextId++, resolve },
    }));
  });
}
