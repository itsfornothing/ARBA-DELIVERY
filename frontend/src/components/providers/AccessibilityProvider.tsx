'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { 
  AccessibleThemeConfig, 
  accessibleTheme, 
  highContrastTheme, 
  reducedMotionTheme 
} from '@/lib/accessibleTheme';
import { useReducedMotion, useHighContrast } from '@/lib/accessibility';

interface AccessibilityContextType {
  theme: AccessibleThemeConfig;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const prefersReducedMotion = useReducedMotion();
  const prefersHighContrast = useHighContrast();
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [announcer, setAnnouncer] = useState<HTMLDivElement | null>(null);

  // Create screen reader announcer element
  useEffect(() => {
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.style.position = 'absolute';
    announcerElement.style.left = '-10000px';
    announcerElement.style.width = '1px';
    announcerElement.style.height = '1px';
    announcerElement.style.overflow = 'hidden';
    
    document.body.appendChild(announcerElement);
    setAnnouncer(announcerElement);
    
    return () => {
      if (document.body.contains(announcerElement)) {
        document.body.removeChild(announcerElement);
      }
    };
  }, []);

  // Function to announce messages to screen readers
  const announceToScreenReader = (message: string) => {
    if (announcer) {
      announcer.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (announcer) {
          announcer.textContent = '';
        }
      }, 1000);
    }
  };

  // Determine which theme to use based on user preferences
  const getTheme = (): AccessibleThemeConfig => {
    let selectedTheme = accessibleTheme;
    
    if (prefersHighContrast) {
      selectedTheme = highContrastTheme;
    }
    
    if (prefersReducedMotion) {
      selectedTheme = {
        ...selectedTheme,
        accessibility: {
          ...selectedTheme.accessibility,
          reducedMotion: true,
        },
        animations: {
          ...selectedTheme.animations,
          duration: {
            fast: 0,
            normal: 0,
            slow: 0,
          },
        },
      };
    }
    
    // Apply font size preferences
    const fontSizeMultipliers = {
      small: 0.875,
      medium: 1,
      large: 1.125,
    };
    
    const multiplier = fontSizeMultipliers[fontSize];
    // Create heading sizes array from fontSize
    const headingSizes = [
      selectedTheme.typography.fontSize['6xl'], // h1
      selectedTheme.typography.fontSize['5xl'], // h2
      selectedTheme.typography.fontSize['4xl'], // h3
      selectedTheme.typography.fontSize['3xl'], // h4
      selectedTheme.typography.fontSize['2xl'], // h5
      selectedTheme.typography.fontSize.xl,     // h6
    ];

    selectedTheme = {
      ...selectedTheme,
      typography: {
        ...selectedTheme.typography,
        fontSize: {
          ...selectedTheme.typography.fontSize,
          base: `${multiplier}rem`,
        },
      },
    };
    
    return selectedTheme;
  };

  const theme = getTheme();

  // Apply global accessibility styles
  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties for accessibility
    root.style.setProperty('--focus-ring-color', theme.accessibility.focusRingColor);
    root.style.setProperty('--focus-ring-width', theme.accessibility.focusRingWidth);
    root.style.setProperty('--focus-ring-offset', theme.accessibility.focusRingOffset);
    root.style.setProperty('--min-touch-target', theme.accessibility.minTouchTarget);
    
    // Apply reduced motion globally
    if (prefersReducedMotion) {
      root.style.setProperty('--animation-duration', '0ms');
      root.style.setProperty('--transition-duration', '0ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
    
    // Apply high contrast mode
    if (prefersHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply font size class
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${fontSize}`);
    
  }, [theme, prefersReducedMotion, prefersHighContrast, fontSize]);

  const contextValue: AccessibilityContextType = {
    theme,
    prefersReducedMotion,
    prefersHighContrast,
    fontSize,
    setFontSize,
    announceToScreenReader,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </AccessibilityContext.Provider>
  );
};