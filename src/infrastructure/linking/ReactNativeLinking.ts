import {Linking} from 'react-native';
import type {ExternalLinking} from '../../app/homeActions';

export const reactNativeLinking: ExternalLinking = {
  canOpenUrl: url => Linking.canOpenURL(url),
  openUrl: async url => { await Linking.openURL(url); },
};
