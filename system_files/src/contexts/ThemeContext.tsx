// MamaTrack GPS — Global Dark/Light Theme Context

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';
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
    // Restore from localStorage or default to system OS preference (prefers-color-scheme)
    const saved = localStorage.getItem('mamatrack-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [screenSize, setScreenSize] = useState<ScreenSizeInfo>(getScreenSizeInfo);

  // Sync with OS system theme changes if user hasn't explicitly set a preference
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const hasSaved = localStorage.getItem('mamatrack-theme');
      if (!hasSaved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener?.('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener?.('change', handleSystemThemeChange);
  }, []);

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
    setTheme((prev: Theme) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', screenSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Reusable Theme Toggle Button ───────────────────────────────────────────
// Import this component in any dashboard header

import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style = {}
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`theme-toggle-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,0,0,0.12)',
        background: isDark
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(0,0,0,0.05)',
        color: isDark ? '#fbbf24' : '#6366f1',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(4px)',
        userSelect: 'none',
        ...style,
      }}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
