import {useCallback, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {executeHomeAction} from '../../app/homeActions';
import type {HomeAction} from '../../app/config/types';
import {useClientConfig} from '../../app/providers/ClientConfigProvider';
import {reactNativeLinking} from '../../infrastructure/linking/ReactNativeLinking';
import type {RootStackParamList} from '../navigation/types';

export function useHomeActionExecutor() {
  const config = useClientConfig();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lock = useRef(false);
  const [executingActionId, setExecutingActionId] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const execute = useCallback(async (action: HomeAction) => {
    if (lock.current) return;
    lock.current = true;
    setExecutingActionId(action.id);
    setErrorMessage(undefined);
    const result = await executeHomeAction(action, {
      config,
      linking: reactNativeLinking,
      navigate: {
        openWebContent: (url, title) => navigation.navigate('WebContent', {url, title}),
        openNativeScreen: destination => {
          if (destination === 'settings') navigation.navigate('Settings');
        },
      },
    });
    if (result.status !== 'success') setErrorMessage(result.message);
    setExecutingActionId(undefined);
    lock.current = false;
  }, [config, navigation]);

  return {execute, executingActionId, errorMessage};
}
