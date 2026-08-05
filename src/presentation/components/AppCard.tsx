import React, {PropsWithChildren} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useAppTheme} from '../theme';

type Padding = 'none' | 'sm' | 'md' | 'lg';
type Props = PropsWithChildren<{onPress?: () => void; accessibilityLabel?: string; padding?: Padding; disabled?: boolean}>;

export function AppCard({children, onPress, accessibilityLabel, padding = 'md', disabled = false}: Props) {
  const theme = useAppTheme();
  const style = [styles.card, theme.shadows.card, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg, padding: theme.spacing[padding]}];
  if (onPress) return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed}) => [style, {opacity: pressed ? 0.8 : disabled ? 0.55 : 1}]}>{children}</Pressable>;
  return <View style={style}>{children}</View>;
}
const styles = StyleSheet.create({card: {borderWidth: StyleSheet.hairlineWidth}});
