import type {ClientConfig} from './types';
import type {WebBridgeMessageType} from './types';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/;
const WEB_BRIDGE_TYPES: ReadonlySet<WebBridgeMessageType> = new Set([
  'openPhone', 'openEmail', 'openMap', 'openExternal', 'share', 'openNative',
  'identifyNotificationUser', 'clearNotificationUser',
]);

function requireText(value: string, field: string) {
  if (!value.trim()) {
    throw new Error(`Invalid client configuration: ${field} is required.`);
  }
}

function requireValidUrl(value: string, field: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new Error(`Invalid client configuration: ${field} must be a valid HTTPS URL.`);
  }
}

function requireHttpsUrl(value: string, field: string) {
  try {
    if (new URL(value).protocol !== 'https:') {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new Error(`Invalid client configuration: ${field} must be a valid HTTPS URL.`);
  }
}

export function validateClientConfig(config: ClientConfig): void {
  requireText(config.clientId, 'clientId');
  requireText(config.appName, 'appName');
  requireValidUrl(config.website.baseUrl, 'website.baseUrl');

  if (config.features.webContent && config.website.allowedDomains.length === 0) {
    throw new Error('Invalid client configuration: website.allowedDomains cannot be empty when web content is enabled.');
  }

  const colors = Object.entries(config.branding).filter(
    (entry): entry is [string, string] => entry[0].endsWith('Color'),
  );
  for (const [name, color] of colors) {
    if (!HEX_COLOR.test(color)) {
      throw new Error(`Invalid client configuration: branding.${name} must be a hexadecimal color.`);
    }
  }

  requireText(config.storage.namespace, 'storage.namespace');

  if (config.webBridge) {
    if (!Number.isInteger(config.webBridge.maxMessageLength) || config.webBridge.maxMessageLength < 256 || config.webBridge.maxMessageLength > 65536) {
      throw new Error('Invalid client configuration: webBridge.maxMessageLength must be an integer from 256 to 65536.');
    }
    if (new Set(config.webBridge.allowedMessageTypes).size !== config.webBridge.allowedMessageTypes.length) {
      throw new Error('Invalid client configuration: webBridge.allowedMessageTypes cannot contain duplicates.');
    }
    if (config.webBridge.enabled && config.webBridge.allowedMessageTypes.length === 0) {
      throw new Error('Invalid client configuration: webBridge.allowedMessageTypes cannot be empty when the bridge is enabled.');
    }
    if (config.webBridge.allowedMessageTypes.some(type => !WEB_BRIDGE_TYPES.has(type))) {
      throw new Error('Invalid client configuration: webBridge.allowedMessageTypes contains an unsupported message type.');
    }
  }

  const actionIds = new Set<string>();
  for (const [index, action] of config.home.actions.entries()) {
    const field = `home.actions[${index}]`;
    requireText(action.id, `${field}.id`);
    requireText(action.title, `${field}.title`);
    if (actionIds.has(action.id)) {
      throw new Error(`Invalid client configuration: duplicate home action ID "${action.id}".`);
    }
    actionIds.add(action.id);

    switch (action.type) {
      case 'web':
        requireText(action.route, `${field}.route`);
        break;
      case 'phone':
        if (!action.phoneNumber?.trim() && !config.contact.phone?.trim()) {
          throw new Error(`Invalid client configuration: ${field} requires a phone number.`);
        }
        break;
      case 'email':
        if (!action.emailAddress?.trim() && !config.contact.email?.trim()) {
          throw new Error(`Invalid client configuration: ${field} requires an email address.`);
        }
        break;
      case 'maps':
        if (!action.mapUrl?.trim() && !action.address?.trim() && !config.contact.mapUrl?.trim() && !config.contact.address?.trim()) {
          throw new Error(`Invalid client configuration: ${field} requires map data or an address.`);
        }
        if (action.mapUrl) requireHttpsUrl(action.mapUrl, `${field}.mapUrl`);
        break;
      case 'externalUrl':
        requireHttpsUrl(action.url, `${field}.url`);
        break;
      case 'nativeScreen':
        if (action.screen !== 'settings') {
          throw new Error(`Invalid client configuration: ${field}.screen is not recognized.`);
        }
        break;
    }
  }

  if (config.features.notifications && !config.notifications.oneSignalAppId?.trim()) {
    throw new Error('Invalid client configuration: notifications.oneSignalAppId is required when notifications are enabled.');
  }
  if (config.notifications.permissionPrompt.enabled) {
    requireText(config.notifications.permissionPrompt.title, 'notifications.permissionPrompt.title');
    requireText(config.notifications.permissionPrompt.message, 'notifications.permissionPrompt.message');
    requireText(config.notifications.permissionPrompt.allowLabel, 'notifications.permissionPrompt.allowLabel');
    requireText(config.notifications.permissionPrompt.laterLabel, 'notifications.permissionPrompt.laterLabel');
  }
  if (config.features.appointments && !config.website.routes.booking) {
    throw new Error('Invalid client configuration: website.routes.booking is required when appointments are enabled.');
  }
  if (config.features.ecommerce && !config.website.routes.shop) {
    throw new Error('Invalid client configuration: website.routes.shop is required when ecommerce is enabled.');
  }
  if (config.features.location && !config.contact.address && !config.contact.mapUrl) {
    throw new Error('Invalid client configuration: an address or map URL is required when location is enabled.');
  }
  if (config.features.contact && !config.contact.phone && !config.contact.email) {
    throw new Error('Invalid client configuration: a phone number or email is required when contact is enabled.');
  }
}
