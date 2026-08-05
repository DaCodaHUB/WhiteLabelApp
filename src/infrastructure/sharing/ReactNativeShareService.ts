import {Share} from 'react-native';
import type {ShareService} from '../../app/webBridge';

export const reactNativeShareService: ShareService = {
  async share(input) {
    const title = input.title?.trim();
    const message = input.message?.trim();
    const url = input.url?.trim();
    if ((!title && !message && !url) || (title && title.length > 256) || (message && message.length > 4000) || (url && url.length > 2048)) {
      throw new Error('Invalid share input.');
    }
    if (url) {
      try { if (new URL(url).protocol !== 'https:') throw new Error('Invalid share URL.'); }
      catch { throw new Error('Invalid share URL.'); }
    }
    const result = await Share.share({title, message: message ?? url ?? '', url});
    return {status: result.action === Share.dismissedAction ? 'cancelled' : 'shared'};
  },
};
