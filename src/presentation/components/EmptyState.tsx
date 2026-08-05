import React from 'react';
import {StyleSheet, View} from 'react-native';
import type {AppIconName} from '../../app/config/types';
import {AppButton} from './AppButton'; import {AppIcon} from './AppIcon'; import {AppText} from './AppText';
export function EmptyState({icon, title, message, actionTitle, onAction}: {icon?: AppIconName; title: string; message?: string; actionTitle?: string; onAction?: () => void}) {
  return <View style={styles.root}>{icon && <AppIcon name={icon} size={32} color="textSecondary" />}<AppText variant="subheading" align="center">{title}</AppText>{message && <AppText color="textSecondary" align="center">{message}</AppText>}{actionTitle && onAction && <AppButton title={actionTitle} onPress={onAction} />}</View>;
}
const styles = StyleSheet.create({root: {alignItems: 'center', gap: 12, justifyContent: 'center', minHeight: 160}});
