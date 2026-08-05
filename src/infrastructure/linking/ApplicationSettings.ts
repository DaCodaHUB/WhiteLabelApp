import {Linking} from 'react-native';

export async function openApplicationSettings(): Promise<void> {
  await Linking.openSettings();
}
