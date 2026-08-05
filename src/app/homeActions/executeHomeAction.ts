import {buildClientUrl, isAllowedClientUrl} from '../config/url';
import type {HomeAction} from '../config/types';
import {buildEmailUrl} from './email';
import {buildMapsUrl} from './maps';
import {buildTelephoneUrl} from './phone';
import type {HomeActionDependencies, HomeActionResult} from './types';

const messages = {
  web: 'This page is not available.',
  phone: 'Calling is not available on this device.',
  email: 'No email application is available.',
  maps: 'Directions could not be opened.',
  link: 'This link could not be opened.',
  native: 'This screen is not available.',
};

function validHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

async function openExternal(url: string | null, message: string, dependencies: HomeActionDependencies): Promise<HomeActionResult> {
  if (!url) return {status: 'failed', message};
  try {
    if (!(await dependencies.linking.canOpenUrl(url))) return {status: 'unsupported', message};
    await dependencies.linking.openUrl(url);
    return {status: 'success'};
  } catch (cause) {
    return {status: 'failed', message, cause};
  }
}

export async function executeHomeAction(action: HomeAction, dependencies: HomeActionDependencies): Promise<HomeActionResult> {
  const {config, navigate} = dependencies;
  switch (action.type) {
    case 'web':
      try {
        const url = buildClientUrl(config.website.baseUrl, action.route);
        if (!isAllowedClientUrl(url, config.website.allowedDomains)) return {status: 'failed', message: messages.web};
        navigate.openWebContent(url, action.title);
        return {status: 'success'};
      } catch (cause) {
        return {status: 'failed', message: messages.web, cause};
      }
    case 'nativeScreen':
      try {
        navigate.openNativeScreen(action.screen);
        return {status: 'success'};
      } catch (cause) {
        return {status: 'failed', message: messages.native, cause};
      }
    case 'phone':
      return openExternal(buildTelephoneUrl(action.phoneNumber ?? config.contact.phone ?? ''), messages.phone, dependencies);
    case 'email':
      return openExternal(buildEmailUrl(action.emailAddress ?? config.contact.email ?? '', action.subject, action.body), messages.email, dependencies);
    case 'maps': {
      const mapUrl = action.mapUrl ?? (action.address ? undefined : config.contact.mapUrl);
      const address = action.address ?? (!mapUrl ? config.contact.address : undefined);
      return openExternal(mapUrl ? validHttpsUrl(mapUrl) : buildMapsUrl(address ?? ''), messages.maps, dependencies);
    }
    case 'externalUrl':
      return openExternal(validHttpsUrl(action.url), messages.link, dependencies);
  }
}
