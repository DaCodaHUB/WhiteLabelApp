import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useClientConfig} from '../../app/providers/ClientConfigProvider';
import {useNotifications} from '../../app/providers/NotificationProvider';
import {openApplicationSettings} from '../../infrastructure/linking/ApplicationSettings';
import {AppButton, AppCard, AppScreen, AppText} from '../components';
import {NotificationPermissionCard} from '../notifications';
import {useAppTheme} from '../theme';

const permissionLabels = {unknown: 'Checking', notDetermined: 'Not requested', denied: 'Denied', authorized: 'Allowed', provisional: 'Provisional', unavailable: 'Unavailable'} as const;

export function SettingsScreen() {
  const config = useClientConfig();
  const notifications = useNotifications();
  const theme = useAppTheme();
  const [showPrompt, setShowPrompt] = useState(false);
  const enable = () => {
    if (config.notifications.permissionPrompt.enabled && !notifications.permissionPromptDismissed) setShowPrompt(true);
    else notifications.requestPermission().catch(() => undefined);
  };
  return <AppScreen scroll>
    <View style={[styles.content, {gap: theme.spacing.md, paddingVertical: theme.spacing.lg}]}>
      <AppText variant="heading">Settings</AppText>
      <AppCard>
        <View style={{gap: theme.spacing.md}}>
          <AppText variant="subheading">Notifications</AppText>
          <AppText color="textSecondary">Status: {permissionLabels[notifications.permissionState]}</AppText>
          {!notifications.enabled && <AppText color="textSecondary">Notifications are not enabled for this app.</AppText>}
          {notifications.enabled && notifications.canRequestPermission && <AppButton title="Enable Notifications" onPress={enable} />}
          {notifications.enabled && notifications.permissionState === 'denied' && !notifications.canRequestPermission && <AppButton title="Open System Settings" variant="outline" onPress={() => openApplicationSettings().catch(() => undefined)} />}
          {notifications.enabled && notifications.permissionState === 'unavailable' && <AppText color="textSecondary">Notifications are unavailable on this device.</AppText>}
        </View>
      </AppCard>
      {showPrompt && <NotificationPermissionCard onComplete={() => setShowPrompt(false)} />}
    </View>
  </AppScreen>;
}
const styles = StyleSheet.create({content: {flex: 1}});
