#!/usr/bin/env node
const path = require('path');
const {resolveClientSelection, validateClientProject, activeClientContent, androidPropertiesContent, androidStringsContent, iosConfigContent, writeFilesAtomically} = require('./clientPackaging');

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
const environment = options.environment || process.env.APP_ENVIRONMENT || 'development';
const selected = resolveClientSelection({environment, clientId: options.client || options.id, cwd: path.resolve(__dirname, '..')});
const workspaceRoot = path.resolve(__dirname, '..');
let validation;

try {
  validation = validateClientProject({workspaceRoot, clientId: selected.clientId, environment});
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const activeClientPath = path.join(workspaceRoot, 'src', 'generated', 'activeClient.ts');
const androidPropsPath = path.join(workspaceRoot, 'android', 'client.generated.properties');
const androidStringsPath = path.join(workspaceRoot, 'android', 'app', 'src', 'main', 'res', 'values', 'client_generated_strings.xml');
const iosConfigPath = path.join(workspaceRoot, 'ios', 'client.generated.xcconfig');

try {
  const nativeConfig = validation.native;
  writeFilesAtomically([
    {path: activeClientPath, content: activeClientContent(selected.clientId, environment)},
    {path: androidPropsPath, content: androidPropertiesContent(selected.clientId, nativeConfig.displayName, nativeConfig.android)},
    {path: androidStringsPath, content: androidStringsContent(nativeConfig.displayName)},
    {path: iosConfigPath, content: iosConfigContent(selected.clientId, nativeConfig.displayName, nativeConfig.ios)},
  ]);
  console.log(`Prepared client '${selected.clientId}' for ${environment}.`);
  console.log('Generated files:');
  console.log(`  - ${path.relative(workspaceRoot, activeClientPath)}`);
  console.log(`  - ${path.relative(workspaceRoot, androidPropsPath)}`);
  console.log(`  - ${path.relative(workspaceRoot, androidStringsPath)}`);
  console.log(`  - ${path.relative(workspaceRoot, iosConfigPath)}`);
  console.log(`iOS values prepared: bundle ${nativeConfig.ios.bundleIdentifier}, target ${nativeConfig.ios.targetName}, scheme ${nativeConfig.ios.schemeName}.`);
  console.log('iOS integration remains unverified until the generated xcconfig is connected and tested on macOS/Xcode.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
