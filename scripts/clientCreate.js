#!/usr/bin/env node
const path = require('path');
const {createClientDefinition} = require('./clientPackaging');

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
const clientId = options.id || options.client || '';
const displayName = options['display-name'] || options.displayName || '';
const androidApplicationId = options['android-id'] || options.androidId || '';
const iosBundleIdentifier = options['ios-id'] || options.iosId || '';

if (!clientId || !displayName || !androidApplicationId || !iosBundleIdentifier) {
  console.error('Usage: npm run client:create -- --id <client-id> --display-name <name> --android-id <application-id> --ios-id <bundle-id>');
  process.exit(1);
}

const workspaceRoot = path.resolve(__dirname, '..');
const result = createClientDefinition({
  workspaceRoot,
  clientId,
  displayName,
  androidApplicationId,
  iosBundleIdentifier,
});

if (result.created.length === 0) {
  console.error(`Client '${clientId}' already exists. No files were created.`);
  process.exit(1);
}

console.log(`Created client '${clientId}' in clients/${clientId}`);
console.log('Next steps:');
console.log(`  - Review clients/${clientId}/client.config.ts`);
console.log(`  - Review clients/${clientId}/client.native.json`);
console.log(`  - Replace public values in both environment files`);
console.log(`  - Add and explicitly register production artwork; credentials belong outside source control`);
console.log(`  - Run: npm run client:validate -- --client ${clientId}`);
console.log(`  - Run: npm run client:prepare -- --client ${clientId} --environment development`);
