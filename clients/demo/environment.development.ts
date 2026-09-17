import type {ClientEnvironmentConfig} from '../../scripts/clientPackaging';

export const environmentConfig = {
  website: {baseUrl: 'https://dacodahub.github.io', allowedDomains: ['dacodahub.github.io']},
} satisfies ClientEnvironmentConfig;
