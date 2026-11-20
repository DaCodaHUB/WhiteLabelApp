import React, {useEffect} from 'react';
import {AccessibilityInfo, StyleSheet, View} from 'react-native';
import {AppButton} from './AppButton'; import {AppText} from './AppText';
export function ErrorState({title, message, onRetry, announce = false}: {title: string; message?: string; onRetry?: () => void; announce?: boolean}) {
  useEffect(() => {
    if (announce) AccessibilityInfo.announceForAccessibility(message ? `${title}. ${message}` : title);
  }, [announce, title, message]);
  return <View style={styles.root}><AppText variant="subheading" color="error" accessibilityRole={announce ? 'header' : undefined}>{title}</AppText>{message && <AppText color="textSecondary" align="center">{message}</AppText>}{onRetry && <AppButton title="Try again" onPress={onRetry} />}</View>;
}
const styles = StyleSheet.create({root: {alignItems: 'center', gap: 12, justifyContent: 'center', minHeight: 160}});
