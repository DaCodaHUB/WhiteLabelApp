import {EventEmitter} from 'events';
import * as path from 'path';
import packageJson from '../package.json';
import demoNative from '../clients/demo/client.native.json';
import sampleCafeNative from '../clients/sample-cafe/client.native.json';
import {clientConfig as demoClientConfig} from '../clients/demo/client.config';
import {environmentConfig as demoDevelopmentEnvironment} from '../clients/demo/environment.development';
import {clientConfig as defaultClientConfig} from '../clients/default/client.config';
import {clientConfig as sampleCafeClientConfig} from '../clients/sample-cafe/client.config';
import {environmentConfig as sampleCafeDevelopmentEnvironment} from '../clients/sample-cafe/environment.development';
import {activeClientContent} from '../scripts/clientPackaging';
import {buildClientUrl, isAllowedClientUrl} from '../src/app/config/url';

type SpawnCall = {
  executable: string;
  args: string[];
  options: {cwd: string; stdio: string; env: NodeJS.ProcessEnv};
};
type Runner = (argv: string[], dependencies?: {
  workspaceRoot?: string;
  env?: NodeJS.ProcessEnv;
  spawn?: (executable: string, args: string[], options: SpawnCall['options']) => EventEmitter;
}) => Promise<number>;

const {runClientCommand} = require('../scripts/clientRun') as {runClientCommand: Runner};

function successfulSpawn(calls: SpawnCall[], exitCodes: number[] = [0, 0]) {
  return (executable: string, args: string[], options: SpawnCall['options']) => {
    calls.push({executable, args, options});
    const child = new EventEmitter();
    const exitCode = exitCodes[calls.length - 1] ?? 0;
    queueMicrotask(() => child.emit('exit', exitCode, null));
    return child;
  };
}

describe('client-aware React Native runner', () => {
  it.each(['android', 'start'])('prepares before launching React Native %s', async command => {
    const calls: SpawnCall[] = [];
    await expect(runClientCommand([command], {
      workspaceRoot: process.cwd(),
      env: {...process.env, APP_CLIENT: 'demo', APP_ENVIRONMENT: 'development'},
      spawn: successfulSpawn(calls),
    })).resolves.toBe(0);

    expect(calls).toHaveLength(2);
    expect(calls[0]?.args[0]).toMatch(/clientPrepare\.js$/);
    expect(calls[1]?.args.slice(1)).toEqual(command === 'android'
      ? ['run-android', '--appId', demoNative.android.applicationId]
      : ['start']);
    expect(calls[1]?.args[0]).toBe(path.join(process.cwd(), 'node_modules', 'react-native', 'cli.js'));
  });

  it('forwards arguments, preserves selection variables, and propagates the CLI exit code', async () => {
    const calls: SpawnCall[] = [];
    const result = await runClientCommand(['android', '--deviceId', 'emulator-5554'], {
      workspaceRoot: process.cwd(),
      env: {...process.env, APP_CLIENT: 'demo', APP_ENVIRONMENT: 'development', RUNNER_TEST_VALUE: 'kept'},
      spawn: successfulSpawn(calls, [0, 23]),
    });

    expect(result).toBe(23);
    expect(calls[1]?.args.slice(1)).toEqual(['run-android', '--appId', demoNative.android.applicationId, '--deviceId', 'emulator-5554']);
    expect(calls[1]?.options).toMatchObject({stdio: 'inherit'});
    expect(calls[1]?.options.env).toMatchObject({APP_CLIENT: 'demo', APP_ENVIRONMENT: 'development', RUNNER_TEST_VALUE: 'kept'});
  });

  it.each([
    ['android', ['--client', 'sample-cafe', '--deviceId', 'emulator-5554'], ['run-android', '--appId', sampleCafeNative.android.applicationId, '--deviceId', 'emulator-5554']],
    ['start', ['--client', 'sample-cafe', '--reset-cache'], ['start', '--reset-cache']],
  ])('prepares explicit Sample Cafe before %s and forwards native options', async (command, args, forwarded) => {
    const calls: SpawnCall[] = [];
    await expect(runClientCommand([command, ...args], {
      workspaceRoot: process.cwd(), env: {...process.env, APP_CLIENT: 'demo', APP_ENVIRONMENT: 'development'}, spawn: successfulSpawn(calls),
    })).resolves.toBe(0);
    expect(calls[0]?.args.slice(-4)).toEqual(['--client', 'sample-cafe', '--environment', 'development']);
    expect(calls[1]?.args.slice(1)).toEqual(forwarded);
    expect(calls[1]?.options.env).toMatchObject({APP_CLIENT: 'sample-cafe', APP_ENVIRONMENT: 'development'});
  });

  it('selects Demo explicitly and accepts positional selection from npm', async () => {
    for (const args of [['--client', 'demo'], ['demo', 'development']]) {
      const calls: SpawnCall[] = [];
      await expect(runClientCommand(['android', ...args], {workspaceRoot: process.cwd(), env: {...process.env, APP_CLIENT: 'sample-cafe'}, spawn: successfulSpawn(calls)})).resolves.toBe(0);
      expect(calls[0]?.args).toContain('demo');
      expect(calls[1]?.options.env.APP_CLIENT).toBe('demo');
      expect(calls[1]?.args.slice(1)).toEqual(['run-android', '--appId', demoNative.android.applicationId]);
    }
  });

  it('uses explicit CLI environment ahead of APP_ENVIRONMENT', async () => {
    const calls: SpawnCall[] = [];
    await expect(runClientCommand(['start', '--client', 'sample-cafe', '--environment', 'development'], {
      workspaceRoot: process.cwd(), env: {...process.env, APP_CLIENT: 'demo', APP_ENVIRONMENT: 'production'}, spawn: successfulSpawn(calls),
    })).resolves.toBe(0);
    expect(calls[0]?.args.slice(-4)).toEqual(['--client', 'sample-cafe', '--environment', 'development']);
    expect(calls[1]?.options.env).toMatchObject({APP_CLIENT: 'sample-cafe', APP_ENVIRONMENT: 'development'});
  });

  it.each([
    ['--client', 'sample-caffee'], ['--client'], ['--environment'], ['--environment', 'staging'], ['--client-id', 'sample-cafe'],
  ])('rejects invalid selection before preparing: %s', async (...args) => {
    const calls: SpawnCall[] = [];
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(runClientCommand(['android', ...args], {workspaceRoot: process.cwd(), env: {...process.env, APP_CLIENT: 'demo'}, spawn: successfulSpawn(calls)})).resolves.toBe(1);
      expect(calls).toHaveLength(0);
      expect(error).toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it.each(['--appId', '--appId=com.unrelated.app', '--appIdSuffix'])('rejects a conflicting Android launch override: %s', async option => {
    const calls: SpawnCall[] = [];
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(runClientCommand(['android', '--client', 'sample-cafe', option], {
        workspaceRoot: process.cwd(), env: {...process.env}, spawn: successfulSpawn(calls),
      })).resolves.toBe(1);
      expect(calls).toHaveLength(0);
      expect(error).toHaveBeenCalledWith(expect.stringContaining('do not pass --appId'));
    } finally {
      error.mockRestore();
    }
  });

  it('does not launch React Native when preparation fails', async () => {
    const calls: SpawnCall[] = [];
    await expect(runClientCommand(['start'], {
      workspaceRoot: process.cwd(), env: {...process.env, APP_CLIENT: 'demo'}, spawn: successfulSpawn(calls, [9]),
    })).resolves.toBe(9);
    expect(calls).toHaveLength(1);
  });

  it('rejects unsupported commands without spawning', async () => {
    const calls: SpawnCall[] = [];
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(runClientCommand(['serve'], {workspaceRoot: process.cwd(), spawn: successfulSpawn(calls)})).resolves.toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Unsupported command'));
    error.mockRestore();
    expect(calls).toHaveLength(0);
  });

  it('keeps package commands non-recursive', () => {
    expect(packageJson.scripts.android).toBe('node scripts/clientRun.js android');
    expect(packageJson.scripts.start).toBe('node scripts/clientRun.js start');
    expect(packageJson.scripts.android).not.toContain('npm run android');
    expect(packageJson.scripts['android:demo']).toBe('node scripts/clientRun.js android --client demo');
  });
});

describe('demo website selection', () => {
  it('uses the exact GitHub Pages mobile demo route', () => {
    expect(demoClientConfig.website).toMatchObject({
      baseUrl: 'https://dacodahub.github.io',
      allowedDomains: ['dacodahub.github.io'],
      routes: {home: '/mobile-demo/'},
    });
    expect(demoClientConfig.home.actions[0]).toMatchObject({type: 'web', route: '/mobile-demo/'});
    expect(demoDevelopmentEnvironment.website).toEqual({
      baseUrl: demoClientConfig.website.baseUrl,
      allowedDomains: demoClientConfig.website.allowedDomains,
    });
    const generated = activeClientContent('demo', 'development');
    expect(generated).toContain("import {clientConfig} from '../../clients/demo/client.config';");
    expect(generated).toContain("import {environmentConfig} from '../../clients/demo/environment.development';");
    expect(generated).toContain('website: {...clientConfig.website, ...environmentConfig.website},');
  });

  it('does not change the production-default client website', () => {
    expect(defaultClientConfig.website).toEqual({
      baseUrl: 'https://example.com', allowedDomains: ['example.com'], routes: {home: '/'},
    });
  });
});

describe('Sample Cafe development website selection', () => {
  it('resolves its Home action to the hosted showcase', () => {
    const website = {...sampleCafeClientConfig.website, ...sampleCafeDevelopmentEnvironment.website};
    expect(website).toEqual({
      baseUrl: 'https://dacodahub.github.io',
      allowedDomains: ['dacodahub.github.io'],
      routes: {home: '/mobile-demo/sample-cafe/', services: '/mobile-demo/sample-cafe/menu.html'},
    });
    expect(sampleCafeClientConfig.home.actions[0]).toMatchObject({type: 'web', route: website.routes.home});
    expect(buildClientUrl(website.baseUrl, website.routes.home)).toBe('https://dacodahub.github.io/mobile-demo/sample-cafe/');
    expect(isAllowedClientUrl('https://dacodahub.github.io/mobile-demo/sample-cafe/', website.allowedDomains)).toBe(true);
    expect(isAllowedClientUrl('https://other.github.io/mobile-demo/sample-cafe/', website.allowedDomains)).toBe(false);
    expect(isAllowedClientUrl('https://dacodahub.github.io.evil.example/', website.allowedDomains)).toBe(false);
  });

  it('keeps Demo and Sample Cafe independent', () => {
    expect(buildClientUrl(demoClientConfig.website.baseUrl, demoClientConfig.website.routes.home)).toBe('https://dacodahub.github.io/mobile-demo/');
    expect(demoClientConfig.website.routes.home).toBe('/mobile-demo/');
    expect(sampleCafeClientConfig.clientId).not.toBe(demoClientConfig.clientId);
    expect(sampleCafeClientConfig.storage.namespace).not.toBe(demoClientConfig.storage.namespace);
    expect(activeClientContent('sample-cafe', 'development')).toContain("import {clientConfig} from '../../clients/sample-cafe/client.config';");
    expect(activeClientContent('sample-cafe', 'development')).toContain("import {environmentConfig} from '../../clients/sample-cafe/environment.development';");
  });
});
