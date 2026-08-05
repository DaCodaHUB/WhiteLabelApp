import React, {PropsWithChildren} from 'react';
import {StyleSheet, View} from 'react-native';
import {AppScreen} from './AppScreen';
import {AppText} from './AppText';
import {useAppTheme} from '../theme';

type Props = PropsWithChildren<{title: string; description: string}>;

export function PlaceholderScreen({title, description, children}: Props) {
  const theme = useAppTheme();

  return (
    <AppScreen><View style={[styles.container, {gap: theme.spacing.sm}]}><AppText variant="heading">{title}</AppText><AppText color="textSecondary">{description}</AppText>{children}</View></AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center'},
});
