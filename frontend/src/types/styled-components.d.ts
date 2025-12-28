import 'styled-components';
import { ThemeConfig } from '@/lib/theme';

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeConfig {}
}