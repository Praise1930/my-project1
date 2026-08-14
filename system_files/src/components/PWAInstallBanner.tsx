// MamaTrack GPS — PWA Install Banner Component

import '../styles/overlays.css';
import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Don't show if user dismissed this session
    if (sessionStorage.getItem('pwa-banner-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const win = window as unknown as { deferredPWAInstallPrompt?: Event };
    if (win.deferredPWAInstallPrompt) {
      handler(win.deferredPWAInstallPrompt);
    }

    // Fallback: show iOS Safari guide after 3s if no prompt fires and on iOS
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const timer = setTimeout(() => {
      if (isIos && isSafari && !sessionStorage.getItem('pwa-banner-dismissed')) {
        setVisible(true);
      }
    }, 3000);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setTimeout(() => setVisible(false), 3000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === 'accepted') {
      setInstalled(true);
      setTimeout(() => setVisible(false), 2500);
    } else {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    if (!sessionStorage.getItem('pwa-banner-dismissed')) {
      sessionStorage.setItem('pwa-banner-dismissed', '1');
    }
    setVisible(false);
  };

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isIosGuide = isIos && !deferredPrompt;

  if (!visible) return null;

  return (
    <div className="ov-install" role="dialog" aria-label="Install MamaTrack">
      {installed ? (
        <>
          <p className="ov-install__title">MamaTrack is installed</p>
          <p className="ov-install__text">
            You can now open it from your home screen, including when you have no signal.
          </p>
        </>
      ) : isIosGuide ? (
        <>
          <p className="ov-install__title">Add MamaTrack to your home screen</p>
          <p className="ov-install__text">
            Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>. It will then open
            like an app and keep working without a signal.
          </p>
          <div className="ov-install__actions">
            <button type="button" className="ov-btn ov-btn--quiet" onClick={handleDismiss}>
              Got it
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="ov-install__title">Install MamaTrack</p>
          <p className="ov-install__text">
            Keep it on your home screen so you can raise an emergency in one tap, even with no signal.
          </p>
          <div className="ov-install__actions">
            <button
              type="button"
              className="ov-btn ov-btn--solid"
              onClick={handleInstall}
              disabled={installing}
            >
              {installing ? 'Installing…' : 'Install'}
            </button>
            <button type="button" className="ov-btn ov-btn--quiet" onClick={handleDismiss}>
              Not now
            </button>
          </div>
        </>
      )}
    </div>
  );
};
