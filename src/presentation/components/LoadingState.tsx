import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useAppTheme} from '../theme';
import {AppText} from './AppText';
export function LoadingState({message = 'Loading'}: {message?: string}) {
  const theme = useAppTheme();
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={message} style={styles.root}><ActivityIndicator color={theme.colors.primary} /><AppText color="textSecondary">{message}</AppText></View>;
}
const styles = StyleSheet.create({root: {alignItems: 'center', gap: 8, justifyContent: 'center', minHeight: 96}});
