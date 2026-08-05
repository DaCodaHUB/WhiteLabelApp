import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useClientConfig} from '../../app/providers/ClientConfigProvider';
import {useNotifications} from '../../app/providers/NotificationProvider';
import {AppButton, AppCard, AppText} from '../components';
import {useAppTheme} from '../theme';

export function NotificationPermissionCard({onComplete}: {onComplete?: () => void}) {
  const {notifications} = useClientConfig();
  const {requestPermission, dismissPermissionPrompt} = useNotifications();
  const theme = useAppTheme();
  const prompt = notifications.permissionPrompt;
  return <AppCard accessibilityLabel={prompt.title}>
    <View style={{gap: theme.spacing.md}}>
      <AppText variant="subheading">{prompt.title}</AppText>
      <AppText color="textSecondary">{prompt.message}</AppText>
      <View style={styles.actions}>
        <AppButton title={prompt.allowLabel} onPress={async () => { dismissPermissionPrompt(); await requestPermission(); onComplete?.(); }} />
        <AppButton title={prompt.laterLabel} variant="text" onPress={() => { dismissPermissionPrompt(); onComplete?.(); }} />
      </View>
    </View>
  </AppCard>;
}
const styles = StyleSheet.create({actions: {gap: 8}});
