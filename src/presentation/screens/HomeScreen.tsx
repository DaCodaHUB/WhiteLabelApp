import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {useClientConfig} from '../../app/providers/ClientConfigProvider';
import {isHomeActionAvailable} from '../../app/config/featureAvailability';
import {AppButton, AppCard, AppIcon, AppScreen, AppText} from '../components';
import {useAppTheme} from '../theme';
import {useHomeActionExecutor} from '../hooks/useHomeActionExecutor';
import {isTestLabAvailable} from '../navigation/developmentGate';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';

export function HomeScreen({navigation}: {navigation: Pick<NativeStackScreenProps<RootStackParamList, 'Home'>['navigation'], 'navigate'>}) {
  const config = useClientConfig();
  const theme = useAppTheme();
  const actions = config.home.actions.filter(action => isHomeActionAvailable(action, config));
  const {execute, executingActionId, errorMessage} = useHomeActionExecutor();
  return (
    <AppScreen scroll>
      <View style={[styles.header, {gap: theme.spacing.sm, paddingVertical: theme.spacing.lg}]}>
        {config.branding.logo && <Image source={config.branding.logo} style={styles.brandLogo} resizeMode="contain" accessibilityLabel={`${config.appName} logo`} />}
        <AppText variant="heading">{config.home.title ?? config.appName}</AppText>
        {config.home.subtitle && <AppText color="textSecondary">{config.home.subtitle}</AppText>}
      </View>
      <View style={{gap: theme.spacing.md}}>
        {errorMessage && <AppText color="error" accessibilityRole="alert">{errorMessage}</AppText>}
        {actions.map(action => (
          <AppCard key={action.id} onPress={() => execute(action)} disabled={Boolean(executingActionId)} accessibilityLabel={action.title}>
            <View style={[styles.action, {gap: theme.spacing.md}]}>
              <AppIcon name={action.icon} color="primary" />
              <View style={styles.actionText}><AppText variant="label">{action.title}</AppText>{action.subtitle && <AppText variant="bodySmall" color="textSecondary">{action.subtitle}</AppText>}</View>
            </View>
          </AppCard>
        ))}
      </View>
      {isTestLabAvailable(__DEV__) && <View style={{paddingVertical: theme.spacing.lg}}><AppButton title="Open Test Lab" variant="outline" onPress={() => navigation.navigate('TestLab')} /></View>}
    </AppScreen>
  );
}

const styles = StyleSheet.create({header: {}, brandLogo: {height: 96, width: 160}, action: {alignItems: 'center', flexDirection: 'row', minHeight: 44}, actionText: {flex: 1}});
