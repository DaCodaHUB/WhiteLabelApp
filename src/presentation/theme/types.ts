import type {TextStyle, ViewStyle} from 'react-native';

export type ThemeColors = {
  primary: string; secondary: string; background: string; surface: string;
  surfaceElevated: string; textPrimary: string; textSecondary: string;
  border: string; error: string; success: string; warning: string;
  disabled: string; onPrimary: string;
};
export type Spacing = {none: 0; xs: 4; sm: 8; md: 16; lg: 24; xl: 32; xxl: 48};
export type TypographyVariant = 'display' | 'heading' | 'subheading' | 'body' | 'bodySmall' | 'label' | 'caption';
export type AppTheme = {
  colors: ThemeColors;
  spacing: Spacing;
  typography: Record<TypographyVariant, TextStyle>;
  radii: {none: 0; sm: 4; md: 8; lg: 16; pill: 999};
  shadows: {card: ViewStyle};
};
