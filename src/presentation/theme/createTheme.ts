import {Platform} from 'react-native';
import type {BrandingConfig} from '../../app/config/types';
import type {AppTheme} from './types';

export function createTheme(branding: BrandingConfig): AppTheme {
  return {
    colors: {
      primary: branding.primaryColor, secondary: branding.secondaryColor,
      background: branding.backgroundColor, surface: branding.surfaceColor,
      surfaceElevated: branding.surfaceColor, textPrimary: branding.textColor,
      textSecondary: branding.mutedTextColor, border: '#CBD5E1', error: '#B91C1C',
      success: '#15803D', warning: '#A16207', disabled: '#94A3B8', onPrimary: '#FFFFFF',
    },
    spacing: {none: 0, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48},
    typography: {
      display: {fontSize: 36, lineHeight: 44, fontWeight: '700'},
      heading: {fontSize: 28, lineHeight: 36, fontWeight: '700'},
      subheading: {fontSize: 20, lineHeight: 28, fontWeight: '600'},
      body: {fontSize: 16, lineHeight: 24, fontWeight: '400'},
      bodySmall: {fontSize: 14, lineHeight: 20, fontWeight: '400'},
      label: {fontSize: 16, lineHeight: 20, fontWeight: '600'},
      caption: {fontSize: 12, lineHeight: 16, fontWeight: '400'},
    },
    radii: {none: 0, sm: 4, md: 8, lg: 16, pill: 999},
    shadows: {card: Platform.select({ios: {shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: {width: 0, height: 2}}, android: {elevation: 2}, default: {}})},
  };
}
