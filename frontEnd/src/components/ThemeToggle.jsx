// ThemeToggle.jsx
import React from 'react';

const ThemeToggle = ({ theme, setTheme }) => (
  <button
    className="btn btn-sm"
    onClick={() => {
      const next = theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      setTheme(next);
    }}
  >
    {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
  </button>
);

export default ThemeToggle;
