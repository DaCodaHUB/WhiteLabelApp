import React, {type ReactNode} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native';
import {AppText} from './AppText';
import {useAppTheme} from '../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'text';
type Props = {title: string; onPress: () => void; variant?: Variant; disabled?: boolean; loading?: boolean; icon?: ReactNode; accessibilityLabel?: string};

export function AppButton({title, onPress, variant = 'primary', disabled = false, loading = false, icon, accessibilityLabel}: Props) {
  const theme = useAppTheme();
  const inactive = disabled || loading;
  const backgrounds: Record<Variant, string> = {primary: theme.colors.primary, secondary: theme.colors.secondary, outline: 'transparent', text: 'transparent'};
  const foreground = variant === 'primary' || variant === 'secondary' ? 'onPrimary' : 'primary';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} accessibilityState={{disabled: inactive, busy: loading}} disabled={inactive} onPress={onPress}
      style={({pressed}) => [styles.button, {backgroundColor: backgrounds[variant], borderColor: variant === 'outline' ? theme.colors.primary : 'transparent', borderRadius: theme.radii.md, paddingHorizontal: theme.spacing.md, opacity: pressed ? 0.78 : inactive ? 0.5 : 1}]}>
      {loading ? <ActivityIndicator color={theme.colors[foreground]} /> : <View style={styles.row}>{icon}{icon && <View style={{width: theme.spacing.sm}} />}<AppText variant="label" color={foreground}>{title}</AppText></View>}
    </Pressable>
  );
}
const styles = StyleSheet.create({button: {minHeight: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center'}, row: {alignItems: 'center', flexDirection: 'row', justifyContent: 'center'}});
