/**
 * **Feature: ui-system-enhancement, Property 1: Theme configuration completeness**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
 * 
 * Property: For any design system configuration, all required color palettes (primary, secondary, neutral, status), 
 * typography scales, spacing values, shadow definitions, and border radius values should be present and properly structured
 */

import * as fc from 'fast-check';
import { 
  enhancedTheme, 
  darkTheme, 
  EnhancedThemeConfig, 
  ColorPalette, 
  StatusColors,
  TypographySystem,
  SpacingSystem,
  ShadowSystem,
  BorderRadiusSystem,
  AnimationSystem
} from '@/lib/theme';

// Generators for theme validation
const colorShadeArb = fc.constantFrom('50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950');
const colorPaletteNameArb = fc.constantFrom('primaryPalette', 'secondaryPalette', 'neutralPalette', 'successPalette', 'warningPalette', 'errorPalette', 'infoPalette');
const statusColorNameArb = fc.constantFrom('success', 'warning', 'error', 'info');
const fontFamilyNameArb = fc.constantFrom('sans', 'display', 'mono');
const fontSizeNameArb = fc.constantFrom('xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl');
const lineHeightNameArb = fc.constantFrom('tight', 'normal', 'relaxed');
const fontWeightNameArb = fc.constantFrom('normal', 'medium', 'semibold', 'bold');
const spacingNameArb = fc.constantFrom('xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '18', '88', '128', '144');
const shadowNameArb = fc.constantFrom('soft', 'medium', 'strong', 'inner-soft');
const borderRadiusNameArb = fc.constantFrom('sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full');
const animationDurationNameArb = fc.constantFrom('fast', 'normal', 'slow');
const animationEasingNameArb = fc.constantFrom('easeIn', 'easeOut', 'easeInOut', 'bounce', 'smooth');
const breakpointNameArb = fc.constantFrom('sm', 'md', 'lg', 'xl', '2xl');
const themeArb = fc.constantFrom(enhancedTheme, darkTheme);

// Helper functions for validation
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

const isValidCSSValue = (value: string): boolean => {
  return typeof value === 'string' && value.length > 0;
};

const isValidColorPalette = (palette: ColorPalette): boolean => {
  const requiredShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;
  return requiredShades.every(shade => 
    palette[shade] && 
    isValidHexColor(palette[shade])
  );
};

const isValidStatusColors = (status: StatusColors): boolean => {
  const requiredColors = ['success', 'warning', 'error', 'info'] as const;
  return requiredColors.every(color => 
    status[color] && 
    isValidHexColor(status[color])
  );
};

const isValidTypographySystem = (typography: TypographySystem): boolean => {
  // Check font families
  const fontFamilies = ['sans', 'display', 'mono'] as const;
  const fontFamiliesValid = fontFamilies.every(family => 
    Array.isArray(typography.fontFamily[family]) && 
    typography.fontFamily[family].length > 0 &&
    typography.fontFamily[family].every(font => typeof font === 'string' && font.length > 0)
  );

  // Check font sizes
  const fontSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'] as const;
  const fontSizesValid = fontSizes.every(size => 
    typography.fontSize[size] && 
    isValidCSSValue(typography.fontSize[size])
  );

  // Check line heights
  const lineHeights = ['tight', 'normal', 'relaxed'] as const;
  const lineHeightsValid = lineHeights.every(height => 
    typography.lineHeight[height] && 
    isValidCSSValue(typography.lineHeight[height])
  );

  // Check font weights
  const fontWeights = ['normal', 'medium', 'semibold', 'bold'] as const;
  const fontWeightsValid = fontWeights.every(weight => 
    typography.fontWeight[weight] && 
    isValidCSSValue(typography.fontWeight[weight])
  );

  return fontFamiliesValid && fontSizesValid && lineHeightsValid && fontWeightsValid;
};

const isValidSpacingSystem = (spacing: SpacingSystem): boolean => {
  const spacingKeys = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '18', '88', '128', '144'] as const;
  const spacingValid = spacingKeys.every(key => 
    spacing[key] && 
    isValidCSSValue(spacing[key])
  );

  const scaleValid = Array.isArray(spacing.scale) && 
    spacing.scale.length > 0 && 
    spacing.scale.every(value => isValidCSSValue(String(value)));

  const unitValid = typeof spacing.unit === 'number' && spacing.unit > 0;

  return spacingValid && scaleValid && unitValid;
};

const isValidShadowSystem = (shadows: ShadowSystem): boolean => {
  const shadowKeys = ['soft', 'medium', 'strong', 'inner-soft'] as const;
  return shadowKeys.every(key => 
    shadows[key] && 
    isValidCSSValue(shadows[key])
  );
};

const isValidBorderRadiusSystem = (borderRadius: BorderRadiusSystem): boolean => {
  const borderRadiusKeys = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] as const;
  return borderRadiusKeys.every(key => 
    borderRadius[key] && 
    isValidCSSValue(borderRadius[key])
  );
};

const isValidAnimationSystem = (animations: AnimationSystem): boolean => {
  const durationKeys = ['fast', 'normal', 'slow'] as const;
  const durationsValid = durationKeys.every(key => 
    typeof animations.duration[key] === 'number' && 
    animations.duration[key] > 0
  );

  const easingKeys = ['easeIn', 'easeOut', 'easeInOut', 'bounce', 'smooth'] as const;
  const easingValid = easingKeys.every(key => 
    animations.easing[key] && 
    isValidCSSValue(animations.easing[key])
  );

  return durationsValid && easingValid;
};

describe('Theme Configuration Completeness Property Tests', () => {
  it('Property 1.1: All color palettes have complete shade ranges (50-950)', () => {
    fc.assert(
      fc.property(
        themeArb,
        colorPaletteNameArb,
        colorShadeArb,
        (theme, paletteName, shade) => {
          const palette = theme.colors[paletteName];
          
          // All palette names from the generator are valid palettes, not status
          expect(palette).toBeDefined();
          expect(typeof palette).toBe('object');
          
          const colorPalette = palette as ColorPalette;
          expect(colorPalette[shade as unknown as keyof ColorPalette]).toBeDefined();
          expect(isValidHexColor(colorPalette[shade as unknown as keyof ColorPalette])).toBe(true);
          
          // Verify complete palette structure
          expect(isValidColorPalette(colorPalette)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1.2: Status colors contain all required color types', () => {
    fc.assert(
      fc.property(
        themeArb,
        statusColorNameArb,
        (theme, statusColorName) => {
          const statusColors = theme.colors.status;
          
          expect(statusColors).toBeDefined();
          expect(statusColors[statusColorName]).toBeDefined();
          expect(isValidHexColor(statusColors[statusColorName])).toBe(true);
          
          // Verify complete status colors structure
          expect(isValidStatusColors(statusColors)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1.3: Typography system contains all required font families and scales', () => {
    fc.assert(
      fc.property(
        themeArb,
        fontFamilyNameArb,
        fontSizeNameArb,
        lineHeightNameArb,
        fontWeightNameArb,
        (theme, fontFamily, fontSize, lineHeight, fontWeight) => {
          const typography = theme.typography;
          
          // Verify font family
          expect(typography.fontFamily[fontFamily]).toBeDefined();
          expect(Array.isArray(typography.fontFamily[fontFamily])).toBe(true);
          expect(typography.fontFamily[fontFamily].length).toBeGreaterThan(0);
          
          // Verify font size
          expect(typography.fontSize[fontSize]).toBeDefined();
          expect(isValidCSSValue(typography.fontSize[fontSize])).toBe(true);
          
          // Verify line height
          expect(typography.lineHeight[lineHeight]).toBeDefined();
          expect(isValidCSSValue(typography.lineHeight[lineHeight])).toBe(true);
          
          // Verify font weight
          expect(typography.fontWeight[fontWeight]).toBeDefined();
          expect(isValidCSSValue(typography.fontWeight[fontWeight])).toBe(true);
          
          // Verify complete typography system
          expect(isValidTypographySystem(typography)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1.4: Spacing system contains all required values and scale', () => {
    fc.assert(
      fc.property(
        themeArb,
        spacingNameArb,
        (theme, spacingName) => {
          const spacing = theme.spacing;
          
          // Verify specific spacing value
          expect(spacing[spacingName]).toBeDefined();
          expect(isValidCSSValue(spacing[spacingName])).toBe(true);
          
          // Verify spacing scale array
          expect(Array.isArray(spacing.scale)).toBe(true);
          expect(spacing.scale.length).toBeGreaterThan(0);
          
          // Verify unit value
          expect(typeof spacing.unit).toBe('number');
          expect(spacing.unit).toBeGreaterThan(0);
          
          // Verify complete spacing system
          expect(isValidSpacingSystem(spacing)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1.5: Shadow system contains all required shadow definitions', () => {
    fc.assert(
      fc.property(
        themeArb,
        shadowNameArb,
        (theme, shadowName) => {
          const shadows = theme.shadows;
          
          // Verify specific shadow
          expect(shadows[shadowName]).toBeDefined();
          expect(isValidCSSValue(shadows[shadowName])).toBe(true);
          
          // Verify complete shadow system
          expect(isValidShadowSystem(shadows)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1.6: Border radius system contains all required values', () => {
    fc.assert(
      fc.property(
        themeArb,
        borderRadiusNameArb,
        (theme, borderRadiusName) => {
          const borderRadius = theme.borderRadius;
          
          // Verify specific border radius
          expect(borderRadius[borderRadiusName]).toBeDefined();
          expect(isValidCSSValue(borderRadius[borderRadiusName])).toBe(true);
          
          // Verify complete border radius system
          expect(isValidBorderRadiusSystem(borderRadius)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1.7: Animation system contains all required duration and easing values', () => {
    fc.assert(
      fc.property(
        themeArb,
        animationDurationNameArb,
        animationEasingNameArb,
        (theme, durationName, easingName) => {
          const animations = theme.animations;
          
          // Verify duration
          expect(animations.duration[durationName]).toBeDefined();
          expect(typeof animations.duration[durationName]).toBe('number');
          expect(animations.duration[durationName]).toBeGreaterThan(0);
          
          // Verify easing
          expect(animations.easing[easingName]).toBeDefined();
          expect(isValidCSSValue(animations.easing[easingName])).toBe(true);
          
          // Verify complete animation system
          expect(isValidAnimationSystem(animations)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1.8: Breakpoint system contains all required responsive breakpoints', () => {
    fc.assert(
      fc.property(
        themeArb,
        breakpointNameArb,
        (theme, breakpointName) => {
          const breakpoints = theme.breakpoints;
          
          // Verify specific breakpoint
          expect(breakpoints[breakpointName]).toBeDefined();
          expect(isValidCSSValue(breakpoints[breakpointName])).toBe(true);
          
          // Verify breakpoint format (should end with 'px')
          expect(breakpoints[breakpointName]).toMatch(/^\d+px$/);
          
          // Verify all required breakpoints exist
          const requiredBreakpoints = ['sm', 'md', 'lg', 'xl', '2xl'] as const;
          requiredBreakpoints.forEach(bp => {
            expect(breakpoints[bp]).toBeDefined();
            expect(breakpoints[bp]).toMatch(/^\d+px$/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1.9: Theme configuration structure is complete and properly typed', () => {
    fc.assert(
      fc.property(
        themeArb,
        (theme) => {
          // Verify top-level structure
          expect(theme).toBeDefined();
          expect(typeof theme).toBe('object');
          
          // Verify all required top-level properties exist
          expect(theme.colors).toBeDefined();
          expect(theme.typography).toBeDefined();
          expect(theme.spacing).toBeDefined();
          expect(theme.shadows).toBeDefined();
          expect(theme.borderRadius).toBeDefined();
          expect(theme.animations).toBeDefined();
          expect(theme.breakpoints).toBeDefined();
          
          // Verify colors structure
          const requiredColorPalettes = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'status'] as const;
          requiredColorPalettes.forEach(palette => {
            expect(theme.colors[palette]).toBeDefined();
          });
          
          // Verify each color palette (except status) has complete shade range
          const colorPalettes = ['primaryPalette', 'secondaryPalette', 'neutralPalette', 'successPalette', 'warningPalette', 'errorPalette', 'infoPalette'] as const;
          colorPalettes.forEach(palette => {
            expect(isValidColorPalette(theme.colors[palette] as ColorPalette)).toBe(true);
          });
          
          // Verify status colors
          expect(isValidStatusColors(theme.colors.status)).toBe(true);
          
          // Verify complete subsystems
          expect(isValidTypographySystem(theme.typography)).toBe(true);
          expect(isValidSpacingSystem(theme.spacing)).toBe(true);
          expect(isValidShadowSystem(theme.shadows)).toBe(true);
          expect(isValidBorderRadiusSystem(theme.borderRadius)).toBe(true);
          expect(isValidAnimationSystem(theme.animations)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1.10: Theme configuration maintains consistency between light and dark variants', () => {
    fc.assert(
      fc.property(
        fc.constant(true), // Simple property to test both themes
        () => {
          // Both themes should have identical structure
          const lightTheme = enhancedTheme;
          const darkTheme_ = darkTheme;
          
          // Verify both themes have same top-level keys
          const lightKeys = Object.keys(lightTheme).sort();
          const darkKeys = Object.keys(darkTheme_).sort();
          expect(lightKeys).toEqual(darkKeys);
          
          // Verify both themes have same color palette keys
          const lightColorKeys = Object.keys(lightTheme.colors).sort();
          const darkColorKeys = Object.keys(darkTheme_.colors).sort();
          expect(lightColorKeys).toEqual(darkColorKeys);
          
          // Verify both themes have same typography structure
          expect(Object.keys(lightTheme.typography)).toEqual(Object.keys(darkTheme_.typography));
          expect(Object.keys(lightTheme.typography.fontFamily)).toEqual(Object.keys(darkTheme_.typography.fontFamily));
          expect(Object.keys(lightTheme.typography.fontSize)).toEqual(Object.keys(darkTheme_.typography.fontSize));
          
          // Verify both themes have same spacing, shadows, etc.
          expect(Object.keys(lightTheme.spacing)).toEqual(Object.keys(darkTheme_.spacing));
          expect(Object.keys(lightTheme.shadows)).toEqual(Object.keys(darkTheme_.shadows));
          expect(Object.keys(lightTheme.borderRadius)).toEqual(Object.keys(darkTheme_.borderRadius));
          expect(Object.keys(lightTheme.animations)).toEqual(Object.keys(darkTheme_.animations));
          expect(Object.keys(lightTheme.breakpoints)).toEqual(Object.keys(darkTheme_.breakpoints));
          
          // Verify both themes are valid
          expect(isValidTypographySystem(lightTheme.typography)).toBe(true);
          expect(isValidTypographySystem(darkTheme_.typography)).toBe(true);
          expect(isValidSpacingSystem(lightTheme.spacing)).toBe(true);
          expect(isValidSpacingSystem(darkTheme_.spacing)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});