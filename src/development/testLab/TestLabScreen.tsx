import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useClientConfig} from '../../app/providers/ClientConfigProvider';
import {reactNativeLinking} from '../../infrastructure/linking/ReactNativeLinking';
import {AppButton, AppCard, AppScreen, AppText} from '../../presentation/components';
import type {RootStackParamList} from '../../presentation/navigation/types';
import {executeTestLabAction} from './executeTestLabAction';
import type {TestLabActionId} from './types';

const actions: ReadonlyArray<{id: TestLabActionId; title: string}> = [
  {id: 'internalWebView', title: 'Internal WebView navigation'},
  {id: 'blockedHttp', title: 'Check blocked HTTP URL'},
  {id: 'maps', title: 'Open native maps'},
];

export function TestLabScreen() {
  const config = useClientConfig();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lastResult, setLastResult] = useState('Not run');
  const hostname = new URL(config.website.baseUrl).hostname;

  const run = async (id: TestLabActionId) => {
    const result = await executeTestLabAction(id, {
      config,
      linking: reactNativeLinking,
      homeNavigation: {
        openWebContent: (url, title) => navigation.navigate('WebContent', {url, title}),
        openNativeScreen: destination => { if (destination === 'settings') navigation.navigate('Settings'); },
      },
    });
    setLastResult(`${id}: ${result.status}${result.detail ? ` (${result.detail})` : ''}`);
  };

  return (
    <AppScreen scroll>
      <AppCard>
        <View style={styles.summary}>
          <AppText variant="subheading">Environment</AppText>
          <AppText>Client: {config.clientId}</AppText><AppText>Web host: {hostname}</AppText>
          <AppText>Bridge: {config.webBridge?.enabled ? 'enabled' : 'disabled'}</AppText>
          <AppText testID="test-lab-result">Last result: {lastResult}</AppText>
        </View>
      </AppCard>
      <View style={styles.actions}>{actions.map(item => <AppButton key={item.id} title={item.title} variant="outline" onPress={() => { run(item.id).catch(() => setLastResult(`${item.id}: failed`)); }} />)}</View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({summary: {gap: 6}, actions: {gap: 10, paddingVertical: 16}});
