import {createTheme} from '../src/presentation/theme';
import {defaultConfig} from '../src/app/config/defaultConfig';

describe('createTheme', () => {
  test('uses client branding for brand and content colors', () => {
    const theme = createTheme({...defaultConfig.branding, primaryColor: '#123456', textColor: '#654321'});
    expect(theme.colors.primary).toBe('#123456');
    expect(theme.colors.textPrimary).toBe('#654321');
  });
  test('provides stable semantic fallback values', () => {
    expect(createTheme(defaultConfig.branding).colors.error).toBe('#B91C1C');
    expect(createTheme(defaultConfig.branding).spacing.md).toBe(16);
  });
});
