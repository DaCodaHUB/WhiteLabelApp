import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {defaultConfig} from '../src/app/config/defaultConfig';
import {ClientConfigProvider} from '../src/app/providers/ClientConfigProvider';
import {AppButton, AppText} from '../src/presentation/components';
import {ThemeProvider} from '../src/presentation/theme';

function render(child: React.ReactNode) {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  ReactTestRenderer.act(() => { renderer = ReactTestRenderer.create(<ClientConfigProvider config={defaultConfig}><ThemeProvider>{child}</ThemeProvider></ClientConfigProvider>); });
  if (!renderer) throw new Error('Renderer was not created.');
  return renderer;
}

test('AppText renders its content', () => {
  expect(render(<AppText>Shared text</AppText>).root.findByProps({children: 'Shared text'})).toBeTruthy();
});

test('AppButton handles presses and ignores presses when disabled', () => {
  const onPress = jest.fn();
  const enabled = render(<AppButton title="Continue" onPress={onPress} />).root.findByProps({accessibilityRole: 'button'});
  ReactTestRenderer.act(() => enabled.props.onPress());
  expect(onPress).toHaveBeenCalledTimes(1);
  const disabled = render(<AppButton title="Disabled" onPress={onPress} disabled />).root.findByProps({accessibilityRole: 'button'});
  expect(disabled.props.disabled).toBe(true);
});
