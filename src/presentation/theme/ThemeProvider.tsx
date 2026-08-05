import React, {createContext, PropsWithChildren, useContext, useMemo} from 'react';
import {useClientConfig} from '../../app/providers/ClientConfigProvider';
import {createTheme} from './createTheme';
import type {AppTheme} from './types';

const ThemeContext = createContext<AppTheme | undefined>(undefined);

export function ThemeProvider({children}: PropsWithChildren) {
  const {branding} = useClientConfig();
  const theme = useMemo(() => createTheme(branding), [branding]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useAppTheme must be used within a ThemeProvider.');
  return theme;
}
