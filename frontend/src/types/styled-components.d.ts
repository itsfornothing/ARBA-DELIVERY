import 'styled-components';
import { EnhancedThemeConfig } from '@/lib/theme';

declare module 'styled-components' {
  export interface DefaultTheme extends EnhancedThemeConfig {}
}