// ============================================================
// FocusGuard AI — Theme Hook
// ============================================================

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // For the extension, we default to dark mode
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    document.documentElement.style.colorScheme = newTheme;
  };

  return { theme, setTheme, toggleTheme };
}
