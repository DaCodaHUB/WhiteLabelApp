import React, {createContext, PropsWithChildren, useContext, useMemo} from 'react';
import type {ClientConfig, ClientFeature} from '../config/types';

const ClientConfigContext = createContext<ClientConfig | undefined>(undefined);

type Props = PropsWithChildren<{config: ClientConfig}>;

export function ClientConfigProvider({children, config}: Props) {
  const stableConfig = useMemo(() => config, [config]);
  return (
    <ClientConfigContext.Provider value={stableConfig}>
      {children}
    </ClientConfigContext.Provider>
  );
}

export function useClientConfig(): ClientConfig {
  const config = useContext(ClientConfigContext);
  if (!config) {
    throw new Error('useClientConfig must be used within a ClientConfigProvider.');
  }
  return config;
}

export function useFeatureFlag(feature: ClientFeature): boolean {
  return useClientConfig().features[feature];
}
