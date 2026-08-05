import React, {PropsWithChildren} from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppTheme} from '../theme';

type Props = PropsWithChildren<{scroll?: boolean; keyboardSafe?: boolean; padded?: boolean}>;

export function AppScreen({children, scroll = false, keyboardSafe = false, padded = true}: Props) {
  const theme = useAppTheme();
  const contentStyle = [styles.content, padded && {paddingHorizontal: theme.spacing.md}];
  const content = scroll ? <ScrollView contentContainerStyle={contentStyle}>{children}</ScrollView> : <View style={contentStyle}>{children}</View>;
  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, {backgroundColor: theme.colors.background}]}>
      {keyboardSafe ? <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{content}</KeyboardAvoidingView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({safe: {flex: 1}, content: {flexGrow: 1}});
