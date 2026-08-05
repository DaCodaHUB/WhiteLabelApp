import React from 'react';
import {Text, type TextProps, type TextStyle} from 'react-native';
import {useAppTheme, type ThemeColors, type TypographyVariant} from '../theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: keyof ThemeColors;
  align?: TextStyle['textAlign'];
};

export function AppText({variant = 'body', color = 'textPrimary', align, style, ...props}: Props) {
  const theme = useAppTheme();
  return <Text {...props} style={[theme.typography[variant], {color: theme.colors[color], textAlign: align}, style]} />;
}
