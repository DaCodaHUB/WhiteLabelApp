import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppButton} from './AppButton'; import {AppText} from './AppText';
export function ErrorState({title, message, onRetry}: {title: string; message?: string; onRetry?: () => void}) {
  return <View style={styles.root}><AppText variant="subheading" color="error">{title}</AppText>{message && <AppText color="textSecondary" align="center">{message}</AppText>}{onRetry && <AppButton title="Try again" onPress={onRetry} />}</View>;
}
const styles = StyleSheet.create({root: {alignItems: 'center', gap: 12, justifyContent: 'center', minHeight: 160}});
