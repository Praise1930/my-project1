// MamaTrack GPS — Error boundary
//
// Without this, any uncaught render error unmounts the whole tree and leaves a
// blank page. That is a poor outcome anywhere and an unacceptable one for a
// responder mid-dispatch, so a failure is contained to a recoverable message
// with the emergency line still visible.
//
// The `resetKey` prop is driven by the current pathname so a navigation clears
// any prior crash automatically, preventing users from being stuck.

import React from 'react';
import '../styles/overlays.css';

interface Props {
  children: React.ReactNode;
  /** Change this value (e.g. to the current pathname) to auto-clear errors on navigation. */
  resetKey?: string;
}

interface State {
  error: Error | null;
  errorInfo: string | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, errorInfo: null, copied: false, showDetails: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Detect dynamic chunk load failures (common when new deployments are made)
    const isChunkError = /dynamically imported module|loading chunk|failed to fetch/i.test(error?.message || '');
    if (isChunkError && typeof window !== 'undefined') {
      const reloadedKey = 'mamatrack_chunk_reload_timestamp';
      const lastAttempt = sessionStorage.getItem(reloadedKey);
      if (!lastAttempt || Date.now() - Number(lastAttempt) > 10000) {
        sessionStorage.setItem(reloadedKey, String(Date.now()));
        window.location.reload();
      }
    }
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled interface error:', error, info.componentStack);
    this.setState({ errorInfo: info.componentStack || null });
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, errorInfo: null, copied: false, showDetails: false });
    }
  }

  private reset = () => this.setState({ error: null, errorInfo: null, copied: false, showDetails: false });

  private reload = () => window.location.reload();

  private goHome = () => {
    this.setState({ error: null, errorInfo: null }, () => {
      window.location.href = '/';
    });
  };

  private clearCacheAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.href = '/';
  };

  private copyErrorDetails = () => {
    const text = `Error: ${this.state.error?.message || 'Unknown error'}\n\nStack:\n${this.state.error?.stack || 'No stack'}\n\nComponent Stack:\n${this.state.errorInfo || 'None'}`;
    navigator.clipboard?.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }).catch(() => {
      // Fallback
    });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const errorMessage = this.state.error.message || String(this.state.error);

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
        <div className="ov-dialog" data-tone="danger" style={{ maxWidth: 520, width: '100%' }}>
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

            {/* Visible Error Message */}
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#991b1b',
              fontSize: '12px',
              lineHeight: 1.5,
              wordBreak: 'break-word',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <strong style={{ fontWeight: 700 }}>Diagnostic Details:</strong>
                <button
                  type="button"
                  onClick={this.copyErrorDetails}
                  style={{
                    border: 'none',
                    background: 'rgba(153, 27, 27, 0.1)',
                    color: '#991b1b',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  {this.state.copied ? '✓ Copied' : 'Copy error'}
                </button>
              </div>
              <code style={{ fontFamily: 'monospace', display: 'block' }}>{errorMessage}</code>

              <button
                type="button"
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#b91c1c',
                  fontSize: '11px',
                  textDecoration: 'underline',
                  padding: 0,
                  marginTop: 6,
                  cursor: 'pointer',
                  display: 'block'
                }}
              >
                {this.state.showDetails ? 'Hide stack trace' : 'Show stack trace'}
              </button>

              {this.state.showDetails && (
                <pre style={{
                  marginTop: 8,
                  maxHeight: 140,
                  overflowY: 'auto',
                  fontSize: '10px',
                  background: 'rgba(0,0,0,0.05)',
                  padding: 8,
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.error.stack || this.state.errorInfo || 'No stack trace available'}
                </pre>
              )}
            </div>

            <p style={{ marginTop: 12, fontSize: '13px' }}>
              <strong>If this is an emergency, call 0800-MAMATRACK now.</strong>
            </p>
          </div>

          <div className="ov-dialog__foot" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="ov-btn ov-btn--quiet" onClick={this.goHome}>
              Go to Home
            </button>
            <button type="button" className="ov-btn ov-btn--quiet" onClick={this.clearCacheAndReset} title="Clears corrupt local session data">
              Clear session
            </button>
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
