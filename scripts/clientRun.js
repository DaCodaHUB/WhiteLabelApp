#!/usr/bin/env node
const path = require('path');
const {spawn} = require('child_process');
const {parseClientArguments, resolveClientSelection} = require('./clientPackaging');

const SUPPORTED_COMMANDS = new Set(['android', 'ios', 'start']);
const CLI_COMMANDS = {android: 'run-android', ios: 'run-ios', start: 'start'};

function spawnAndWait(spawnProcess, executable, args, options, label) {
  return new Promise(resolve => {
    let settled = false;
    let child;
    try {
      child = spawnProcess(executable, args, options);
    } catch (error) {
      console.error(`Unable to start ${label}: ${error instanceof Error ? error.message : String(error)}`);
      resolve(1);
      return;
    }
    child.once('error', error => {
      if (settled) return;
      settled = true;
      console.error(`Unable to start ${label}: ${error.message}`);
      resolve(1);
    });
    child.once('exit', (code, signal) => {
      if (settled) return;
      settled = true;
      if (signal) {
        console.error(`${label} terminated by signal ${signal}.`);
        resolve(1);
        return;
      }
      resolve(code === null ? 1 : code);
    });
  });
}

async function runClientCommand(argv, dependencies = {}) {
  const command = argv[0];
  if (!SUPPORTED_COMMANDS.has(command)) {
    console.error(`Unsupported command '${command || ''}'. Use android, ios, or start.`);
    return 1;
  }

  const workspaceRoot = dependencies.workspaceRoot || path.resolve(__dirname, '..');
  const environmentSource = dependencies.env || process.env;
  let selected;
  let forwardedArgs;
  try {
    const parsed = parseClientArguments(argv.slice(1), true);
    const environment = parsed.environment ?? environmentSource.APP_ENVIRONMENT ?? 'development';
    selected = resolveClientSelection({environment, clientId: parsed.clientId, cwd: workspaceRoot, env: environmentSource});
    forwardedArgs = parsed.forwardedArgs;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const childEnvironment = {
    ...environmentSource,
    APP_CLIENT: selected.clientId,
    APP_ENVIRONMENT: selected.environment,
  };
  const spawnProcess = dependencies.spawn || spawn;
  const childOptions = {cwd: workspaceRoot, stdio: 'inherit', env: childEnvironment};
  const prepareExitCode = await spawnAndWait(
    spawnProcess,
    process.execPath,
    [path.join(workspaceRoot, 'scripts', 'clientPrepare.js'), '--client', selected.clientId, '--environment', selected.environment],
    childOptions,
    'client preparation',
  );
  if (prepareExitCode !== 0) return prepareExitCode;

  const cliPath = path.join(workspaceRoot, 'node_modules', 'react-native', 'cli.js');
  const cliCommand = CLI_COMMANDS[command];
  return spawnAndWait(
    spawnProcess,
    process.execPath,
    [cliPath, cliCommand, ...forwardedArgs],
    childOptions,
    `React Native ${command}`,
  );
}

if (require.main === module) {
  runClientCommand(process.argv.slice(2))
    .then(exitCode => { process.exitCode = exitCode; })
    .catch(error => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}

module.exports = {runClientCommand};
