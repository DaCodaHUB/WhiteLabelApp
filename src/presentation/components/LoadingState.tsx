import React, {useEffect} from 'react';
import {AccessibilityInfo, ActivityIndicator, StyleSheet, View} from 'react-native';
import {useAppTheme} from '../theme';
import {AppText} from './AppText';
export function LoadingState({message = 'Loading', announce = false}: {message?: string; announce?: boolean}) {
  const theme = useAppTheme();
  useEffect(() => {
    if (announce) AccessibilityInfo.announceForAccessibility(message);
  }, [announce, message]);
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={message} style={styles.root}><ActivityIndicator color={theme.colors.primary} /><AppText color="textSecondary">{message}</AppText></View>;
}
const styles = StyleSheet.create({root: {alignItems: 'center', gap: 8, justifyContent: 'center', minHeight: 96}});
