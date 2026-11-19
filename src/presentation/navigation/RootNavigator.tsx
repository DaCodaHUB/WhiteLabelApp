import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useClientConfig} from '../../app/providers/ClientConfigProvider';
import {useAppTheme} from '../theme';
import {HomeScreen} from '../screens/HomeScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {WebContentScreen} from '../screens/WebContentScreen';
import type {RootStackParamList} from './types';
import {isTestLabAvailable} from './developmentGate';

const TestLabScreen = isTestLabAvailable(__DEV__)
  ? require('../../development/testLab/TestLabScreen').TestLabScreen
  : undefined;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const config = useClientConfig();
  const appTheme = useAppTheme();
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.surface,
      text: appTheme.colors.textPrimary,
      border: appTheme.colors.border,
    },
  };

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: config.appName}}
        />
        {config.features.webContent && (
          <Stack.Screen
            name="WebContent"
            component={WebContentScreen}
            options={({route}) => ({title: route.params.title ?? 'Web content'})}
          />
        )}
        {config.features.settings && (
          <Stack.Screen name="Settings" component={SettingsScreen} />
        )}
        {isTestLabAvailable(__DEV__) && TestLabScreen && (
          <Stack.Screen name="TestLab" component={TestLabScreen} options={{title: 'Test Lab'}} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
