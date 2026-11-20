import React, {useMemo} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {createWebBridgeHandler} from '../../app/webBridge';
import {useClientConfig} from '../../app/providers/ClientConfigProvider';
import {reactNativeLinking} from '../../infrastructure/linking/ReactNativeLinking';
import {reactNativeShareService} from '../../infrastructure/sharing/ReactNativeShareService';
import {ErrorState} from '../components';
import type {RootStackParamList} from '../navigation/types';
import {AppWebView, evaluateWebRequest} from '../webview';

type Props = Pick<NativeStackScreenProps<RootStackParamList, 'WebContent'>, 'route'>;

function BridgeEnabledWebView({uri}: {uri: string}) {
  const config = useClientConfig();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bridgeHandler = useMemo(() => createWebBridgeHandler({
    config,
    linking: reactNativeLinking,
    sharing: reactNativeShareService,
    navigation: {openNative: destination => { if (destination === 'settings') navigation.navigate('Settings'); }},
  }), [config, navigation]);
  const bridge = config.webBridge;
  if (!bridge?.enabled) return null;

  return <AppWebView initialUrl={uri} allowedDomains={config.website.allowedDomains} bridge={{
    enabled: true,
    maxMessageLength: bridge.maxMessageLength,
    handleMessage: bridgeHandler,
  }} />;
}

export function WebContentScreen({route}: Props) {
  const config = useClientConfig();
  if (!config.features.webContent) return <ErrorState title="Page unavailable" message="This page is not available." />;
  const {website} = config;
  const uri = route.params.url;
  if (evaluateWebRequest(uri, website.allowedDomains).type !== 'allowInternal' || uri === 'about:blank') {
    return <ErrorState title="Page unavailable" message="This page is not available." />;
  }

  if (config.webBridge?.enabled) return <BridgeEnabledWebView uri={uri} />;
  return <AppWebView initialUrl={uri} allowedDomains={website.allowedDomains} cafePresentation={config.clientId === 'sample-cafe'} />;
}
