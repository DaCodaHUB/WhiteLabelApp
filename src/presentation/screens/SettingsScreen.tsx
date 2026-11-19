import React from 'react';
import {useClientConfig} from '../../app/providers/ClientConfigProvider';
import {AppCard, AppScreen, AppText} from '../components';

export function SettingsScreen() {
  const {appName} = useClientConfig();
  return (
    <AppScreen>
      <AppCard>
        <AppText variant="subheading">About this app</AppText>
        <AppText>{appName}</AppText>
      </AppCard>
    </AppScreen>
  );
}
