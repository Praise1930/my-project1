// MamaTrack GPS — Confirmation dialog
//
// Mounted once at the application root and driven by confirmAction() from the
// toast bus, so any module can ask for a confirmation without rendering a
// dialog of its own.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIRM_EVENT, ConfirmRequest } from './toastBus';
import { AlertIcon, ErrorIcon, InfoIcon } from './OverlayIcons';
import '../styles/overlays.css';

export const ConfirmDialog: React.FC = () => {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      restoreFocusTo.current = document.activeElement as HTMLElement;
      setRequest((event as CustomEvent<ConfirmRequest>).detail);
    };
    window.addEventListener(CONFIRM_EVENT, handler);
    return () => window.removeEventListener(CONFIRM_EVENT, handler);
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    setRequest((current) => {
      current?.resolve(confirmed);
      return null;
    });
    // Send focus back where it came from so the keyboard user is not dropped
    // at the top of the document after answering.
    restoreFocusTo.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!request) return;
    confirmRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        settle(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [request, settle]);

  if (!request) return null;

  const tone = request.tone || 'warning';
  const Mark = tone === 'danger' ? ErrorIcon : tone === 'info' ? InfoIcon : AlertIcon;

  return (
    <div
      className="ov-scrim"
      onMouseDown={(e) => { if (e.target === e.currentTarget) settle(false); }}
    >
      <div
        className="ov-dialog"
        data-tone={tone}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ov-dialog-title"
        aria-describedby="ov-dialog-message"
      >
        <div className="ov-dialog__head">
          <span className="ov-dialog__mark"><Mark size={18} /></span>
          <h2 className="ov-dialog__title" id="ov-dialog-title">{request.title}</h2>
        </div>

        <div className="ov-dialog__body" id="ov-dialog-message">
          <p>{request.message}</p>
        </div>

        <div className="ov-dialog__foot">
          <button type="button" className="ov-btn ov-btn--quiet" onClick={() => settle(false)}>
            {request.cancelLabel || 'Cancel'}
          </button>
          <button
            type="button"
            className="ov-btn ov-btn--solid"
            ref={confirmRef}
            onClick={() => settle(true)}
          >
            {request.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
