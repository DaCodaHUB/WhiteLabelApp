import React from 'react';
import {Image, Platform, Pressable, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {HomeAction} from '../../app/config/types';
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
  if (config.clientId === 'sample-cafe') {
    return (
      <SafeAreaView edges={['top']} style={[styles.cafeSafeArea, {backgroundColor: theme.colors.background}]}>
        <AppScreen scroll>
          <SampleCafeHome actions={actions} execute={execute} executingActionId={executingActionId} errorMessage={errorMessage} />
          {isTestLabAvailable(__DEV__) && <View style={styles.cafeTestLab}><AppButton title="Open Test Lab" variant="text" onPress={() => navigation.navigate('TestLab')} /></View>}
        </AppScreen>
      </SafeAreaView>
    );
  }
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

function SampleCafeHome({actions, execute, executingActionId, errorMessage}: {
  actions: HomeAction[];
  execute: (action: HomeAction) => void;
  executingActionId?: string;
  errorMessage?: string;
}) {
  const {branding} = useClientConfig();
  const menu = actions.find(action => action.id === 'menu');
  const website = actions.find(action => action.id === 'website');
  const utilities = actions.filter(action => action !== menu && action !== website);
  const disabled = Boolean(executingActionId);
  return (
    <View style={styles.cafeContent}>
      {branding.logo && <Image source={branding.logo} style={styles.cafeLogo} resizeMode="contain" accessibilityLabel="Sample Cafe" />}
      <View style={styles.cafeIntro}>
        <AppText accessibilityRole="header" style={styles.cafeHeadline}>Coffee made for slow mornings.</AppText>
        <AppText color="textSecondary">Fresh coffee, simple food, and a warm place to linger.</AppText>
      </View>
      {errorMessage && <AppText color="error" accessibilityRole="alert" accessibilityLiveRegion="polite">{errorMessage}</AppText>}
      <View style={styles.cafeActions}>
        {menu && <AppButton title={menu.title} onPress={() => execute(menu)} disabled={disabled} />}
        {website && <AppButton title={website.title} variant="text" onPress={() => execute(website)} disabled={disabled} />}
      </View>
      {utilities.length > 0 && (
        <View style={styles.cafeUtilities}>
          <AppText accessibilityRole="header" variant="subheading">Visit and more</AppText>
          {utilities.map(action => (
            <Pressable key={action.id} accessibilityRole="button" accessibilityLabel={action.title}
              accessibilityState={{disabled}} disabled={disabled} onPress={() => execute(action)}
              style={({pressed}) => [styles.cafeUtility, {opacity: disabled ? 0.5 : pressed ? 0.65 : 1}]}>
              <AppIcon name={action.icon} color="primary" />
              <AppText style={styles.actionText}>{action.title}</AppText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {},
  brandLogo: {height: 96, width: 160},
  action: {alignItems: 'center', flexDirection: 'row', minHeight: 44},
  actionText: {flex: 1},
  cafeSafeArea: {flex: 1},
  cafeContent: {alignSelf: 'center', width: '100%', maxWidth: 520, paddingHorizontal: 4, paddingTop: 20, paddingBottom: 24, gap: 24},
  cafeLogo: {width: 216, maxWidth: '100%', aspectRatio: 1200 / 420},
  cafeIntro: {gap: 12},
  cafeHeadline: {fontFamily: Platform.select({ios: 'Georgia', default: 'serif'}), fontSize: 46, lineHeight: 51},
  cafeActions: {gap: 6},
  cafeUtilities: {gap: 4, backgroundColor: '#EADBC7', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16},
  cafeUtility: {minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12},
  cafeTestLab: {alignSelf: 'center', paddingBottom: 16},
});
