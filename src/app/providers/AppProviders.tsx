import React, {PropsWithChildren} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import type {ClientConfig} from '../config/types';
import {ClientConfigProvider} from './ClientConfigProvider';
import {ThemeProvider} from '../../presentation/theme';

type Props = PropsWithChildren<{config: ClientConfig}>;

export function AppProviders({children, config}: Props) {
  return (
    <SafeAreaProvider>
      <ClientConfigProvider config={config}>
        <ThemeProvider>{children}</ThemeProvider>
      </ClientConfigProvider>
    </SafeAreaProvider>
  );
}
