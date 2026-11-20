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
  const isSampleCafe = config.clientId === 'sample-cafe';
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
          options={{title: config.appName, ...(isSampleCafe ? {headerShown: false} : {})}}
        />
        {config.features.webContent && (
          <Stack.Screen
            name="WebContent"
            component={WebContentScreen}
            options={({route}) => isSampleCafe ? {
              title: route.params.title === 'View Menu' ? 'Menu' : 'Website',
              headerStyle: {backgroundColor: appTheme.colors.background},
              headerTintColor: appTheme.colors.textPrimary,
              headerShadowVisible: false,
            } : {title: route.params.title ?? 'Web content'}}
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
