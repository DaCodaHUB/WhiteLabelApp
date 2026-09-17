import {EventEmitter} from 'events';
import * as path from 'path';
import packageJson from '../package.json';
import {clientConfig as demoClientConfig} from '../clients/demo/client.config';
import {environmentConfig as demoDevelopmentEnvironment} from '../clients/demo/environment.development';
import {clientConfig as defaultClientConfig} from '../clients/default/client.config';
import {activeClientContent} from '../scripts/clientPackaging';

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
    expect(calls[1]?.args.slice(-1)).toEqual([command === 'android' ? 'run-android' : 'start']);
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
    expect(calls[1]?.args.slice(1)).toEqual(['run-android', '--deviceId', 'emulator-5554']);
    expect(calls[1]?.options).toMatchObject({stdio: 'inherit'});
    expect(calls[1]?.options.env).toMatchObject({APP_CLIENT: 'demo', APP_ENVIRONMENT: 'development', RUNNER_TEST_VALUE: 'kept'});
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
