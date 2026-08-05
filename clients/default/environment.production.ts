import type {ClientEnvironmentConfig} from '../../scripts/clientPackaging';

export const environmentConfig = {
  website: {baseUrl: 'https://example.com', allowedDomains: ['example.com']},
  analyticsEnabled: false,
  logging: 'error',
} satisfies ClientEnvironmentConfig;
