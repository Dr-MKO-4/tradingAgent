// src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

// Dark theme by default; the choice is remembered in localStorage.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  useEffect(() => {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f6f7f9' : '#0a0d13');
  }, [theme]);
  const toggle = () => setTheme(theme === 'light' ? 'dark' : 'light');
  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
