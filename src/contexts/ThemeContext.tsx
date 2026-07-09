// MamaTrack GPS — Global Dark/Light Theme Context

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Restore from localStorage or default to light
    const saved = localStorage.getItem('mamatrack-theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // Apply data-theme and data-bs-theme attributes to <html> element on every change
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
    localStorage.setItem('mamatrack-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
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
