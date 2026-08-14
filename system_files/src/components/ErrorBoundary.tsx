// MamaTrack GPS — Error boundary
//
// Without this, any uncaught render error unmounts the whole tree and leaves a
// blank page. That is a poor outcome anywhere and an unacceptable one for a
// responder mid-dispatch, so a failure is contained to a recoverable message
// with the emergency line still visible.

import React from 'react';
import '../styles/overlays.css';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Kept on the device: the console is the only diagnostic channel available
    // when a field device fails and cannot reach the server.
    console.error('Unhandled interface error:', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  private reload = () => window.location.reload();

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: 'var(--ov-surface-sunk, #f4f6f8)',
        }}
      >
        <div className="ov-dialog" data-tone="danger" style={{ maxWidth: 460 }}>
          <div className="ov-dialog__head">
            <span className="ov-dialog__mark" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.8v4.6" />
                <path d="M12 16.1h.01" />
              </svg>
            </span>
            <h2 className="ov-dialog__title">This screen stopped responding</h2>
          </div>

          <div className="ov-dialog__body">
            <p>
              Your records are safe — nothing you entered has been lost. Try opening the screen
              again, and reload the app if it keeps happening.
            </p>
            <p style={{ marginTop: 10 }}>
              <strong>If this is an emergency, call 0800-MAMATRACK now.</strong>
            </p>
          </div>

          <div className="ov-dialog__foot">
            <button type="button" className="ov-btn ov-btn--quiet" onClick={this.reload}>
              Reload the app
            </button>
            <button type="button" className="ov-btn ov-btn--solid" onClick={this.reset}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
