import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type {AppIconName} from '../../app/config/types';
import {useAppTheme, type ThemeColors} from '../theme';

type Props = {name: AppIconName; size?: number; color?: keyof ThemeColors; accessibilityLabel?: string};

export function AppIcon({name, size = 24, color = 'textPrimary', accessibilityLabel}: Props) {
  const theme = useAppTheme();
  return <MaterialIcons name={name} size={size} color={theme.colors[color]} accessible={Boolean(accessibilityLabel)} accessibilityLabel={accessibilityLabel} />;
}
