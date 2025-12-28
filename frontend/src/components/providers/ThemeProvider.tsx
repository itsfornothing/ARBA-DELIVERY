'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { defaultTheme, darkTheme, ThemeConfig } from '@/lib/theme';
import { GlobalStyles } from './GlobalStyles';

interface ThemeContextType {
  theme: ThemeConfig;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeConfig;
  enableDarkMode?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme: initialTheme = defaultTheme,
  enableDarkMode = true,
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(initialTheme);
  const [isDark, setIsDark] = useState(false);

  // Load theme preference from localStorage
  useEffect(() => {
    if (enableDarkMode && typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-preference');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setCurrentTheme(darkTheme);
        setIsDark(true);
      } else {
        setCurrentTheme(defaultTheme);
        setIsDark(false);
      }
    }
  }, [enableDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (enableDarkMode && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        const savedTheme = localStorage.getItem('theme-preference');
        if (!savedTheme) {
          setCurrentTheme(e.matches ? darkTheme : defaultTheme);
          setIsDark(e.matches);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [enableDarkMode]);

  const toggleTheme = () => {
    if (!enableDarkMode) return;
    
    const newIsDark = !isDark;
    const newTheme = newIsDark ? darkTheme : defaultTheme;
    
    setCurrentTheme(newTheme);
    setIsDark(newIsDark);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-preference', newIsDark ? 'dark' : 'light');
    }
  };

  const setTheme = (theme: ThemeConfig) => {
    setCurrentTheme(theme);
    // Determine if the theme is dark based on background color
    const isDarkTheme = theme.colors.background === darkTheme.colors.background;
    setIsDark(isDarkTheme);
  };

  const contextValue: ThemeContextType = {
    theme: currentTheme,
    isDark,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={currentTheme}>
        <GlobalStyles theme={currentTheme} />
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};