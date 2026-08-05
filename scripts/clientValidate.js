#!/usr/bin/env node
const path = require('path');
const {validateClientProject, resolveClientSelection} = require('./clientPackaging');

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[index + 1] : '';
    args[key] = value;
    if (value && argv[index + 1] && !argv[index + 1].startsWith('--')) index += 1;
  }
  return args;
}

const options = parseArgs(process.argv.slice(2));
if (options.environment && !['development', 'production'].includes(options.environment)) {
  console.error("--environment must be 'development' or 'production'.");
  process.exit(1);
}
const environment = options.environment || 'development';
const selected = resolveClientSelection({environment, clientId: options.client || options.id, cwd: path.resolve(__dirname, '..')});
try {
  validateClientProject({workspaceRoot: path.resolve(__dirname, '..'), clientId: selected.clientId, environment});
  console.log(`Client '${selected.clientId}' validates successfully.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
