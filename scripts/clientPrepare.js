#!/usr/bin/env node
const path = require('path');
const {parseClientArguments, resolveClientSelection, validateClientProject, activeClientContent, androidPropertiesContent, androidStringsContent, iosConfigContent, buildClientArtworkFiles, writeFilesAtomically} = require('./clientPackaging');
const workspaceRoot = path.resolve(__dirname, '..');
let validation;
let selected;

try {
  const options = parseClientArguments(process.argv.slice(2));
  const environment = options.environment ?? process.env.APP_ENVIRONMENT ?? 'development';
  selected = resolveClientSelection({environment, clientId: options.clientId, cwd: workspaceRoot});
  validation = validateClientProject({workspaceRoot, clientId: selected.clientId, environment: selected.environment});
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const activeClientPath = path.join(workspaceRoot, 'src', 'generated', 'activeClient.ts');
const androidPropsPath = path.join(workspaceRoot, 'android', 'client.generated.properties');
const androidStringsPath = path.join(workspaceRoot, 'android', 'app', 'src', 'main', 'res', 'values', 'client_generated_strings.xml');
const iosConfigPath = path.join(workspaceRoot, 'ios', 'client.generated.xcconfig');

buildClientArtworkFiles(workspaceRoot, selected.clientId, selected.environment, validation.runtime.branding).then(artworkFiles => {
  const nativeConfig = validation.native;
  writeFilesAtomically([
    {path: activeClientPath, content: activeClientContent(selected.clientId, selected.environment)},
    {path: androidPropsPath, content: androidPropertiesContent(selected.clientId, nativeConfig.displayName, nativeConfig.android)},
    {path: androidStringsPath, content: androidStringsContent(nativeConfig.displayName)},
    {path: iosConfigPath, content: iosConfigContent(selected.clientId, nativeConfig.displayName, nativeConfig.ios)},
    ...artworkFiles,
  ]);
  console.log(`Prepared client '${selected.clientId}' for ${selected.environment}.`);
  console.log('Generated files:');
  console.log(`  - ${path.relative(workspaceRoot, activeClientPath)}`);
  console.log(`  - ${path.relative(workspaceRoot, androidPropsPath)}`);
  console.log(`  - ${path.relative(workspaceRoot, androidStringsPath)}`);
  console.log(`  - ${path.relative(workspaceRoot, iosConfigPath)}`);
  console.log(`  - ${artworkFiles.length} generated artwork files for Android, iOS, and runtime branding`);
  console.log(`iOS values prepared: bundle ${nativeConfig.ios.bundleIdentifier}, display name ${nativeConfig.displayName}, URL scheme ${nativeConfig.ios.deepLinkScheme}.`);
  console.log('Verify the generated iOS identity in Xcode on macOS before release.');
}).catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
