import type {ClientEnvironmentConfig} from '../../scripts/clientPackaging';

export const environmentConfig = {
  website: {baseUrl: 'https://sample-cafe.example', allowedDomains: ['sample-cafe.example']},
} satisfies ClientEnvironmentConfig;
