// MamaTrack GPS — Global Dark/Light Theme Context

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface ScreenSizeInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  screenSize: ScreenSizeInfo;
}

const getScreenSizeInfo = (): ScreenSizeInfo => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const height = typeof window !== 'undefined' ? window.innerHeight : 768;
  const deviceType: DeviceType = width <= 640 ? 'mobile' : width <= 1024 ? 'tablet' : 'desktop';
  const orientation: Orientation = width >= height ? 'landscape' : 'portrait';

  return {
    width,
    height,
    deviceType,
    orientation,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  };
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
  screenSize: getScreenSizeInfo(),
});

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

// eslint-disable-next-line react-refresh/only-export-components
export const useScreenSize = () => {
  const { screenSize } = useTheme();
  return screenSize;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Restore from localStorage or default to light
    const saved = localStorage.getItem('mamatrack-theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [screenSize, setScreenSize] = useState<ScreenSizeInfo>(getScreenSizeInfo);

  // Apply data-theme, data-bs-theme, data-device-type, and data-orientation attributes to <html> element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
    root.setAttribute('data-device-type', screenSize.deviceType);
    root.setAttribute('data-orientation', screenSize.orientation);
    localStorage.setItem('mamatrack-theme', theme);
  }, [theme, screenSize]);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      const info = getScreenSizeInfo();
      setScreenSize(info);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', screenSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Reusable Theme Toggle Button ───────────────────────────────────────────
// Import this component in any dashboard header

export const ThemeToggle: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style = {}
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`theme-toggle-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 14px',
        borderRadius: '20px',
        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
        background: isDark
          ? 'rgba(255,255,255,0.07)'
          : 'rgba(0,0,0,0.04)',
        color: isDark ? '#f1f5f9' : '#374151',
        cursor: 'pointer',
        fontSize: '0.78rem',
        fontWeight: 700,
        fontFamily: 'inherit',
        letterSpacing: '0.03em',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(4px)',
        userSelect: 'none',
        ...style,
      }}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1 }}>
        {isDark ? '☀️' : '🌙'}
      </span>
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
};
