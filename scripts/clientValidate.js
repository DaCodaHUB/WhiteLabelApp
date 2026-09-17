#!/usr/bin/env node
const path = require('path');
const {parseClientArguments, validateClientProject, loadClientArtwork, resolveClientSelection} = require('./clientPackaging');
try {
  const workspaceRoot = path.resolve(__dirname, '..');
  const options = parseClientArguments(process.argv.slice(2));
  const environment = options.environment ?? process.env.APP_ENVIRONMENT ?? 'development';
  const selected = resolveClientSelection({environment, clientId: options.clientId, cwd: workspaceRoot});
  const validation = validateClientProject({workspaceRoot, clientId: selected.clientId, environment: selected.environment});
  loadClientArtwork(path.join(workspaceRoot, 'clients', selected.clientId), selected.environment, validation.runtime.branding.primaryColor).then(() => {
    console.log(`Client '${selected.clientId}' validates successfully.`);
  }).catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
