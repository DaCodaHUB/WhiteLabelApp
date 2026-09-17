#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {validateClientProject, loadClientArtwork} = require('./clientPackaging');

const workspaceRoot = path.resolve(__dirname, '..');
const clientsRoot = path.join(workspaceRoot, 'clients');
if (!fs.existsSync(clientsRoot)) {
  console.log('No clients found.');
  process.exit(0);
}

async function listClients() {
  for (const entry of fs.readdirSync(clientsRoot, {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    const clientId = entry.name;
    let status = 'valid';
    let displayName = '(unreadable)';
    try {
      const result = validateClientProject({workspaceRoot, clientId, environment: 'development'});
      await loadClientArtwork(path.join(clientsRoot, clientId), 'development', result.runtime.branding.primaryColor);
      displayName = result.native.displayName;
    } catch {
      status = 'invalid';
      try { displayName = JSON.parse(fs.readFileSync(path.join(clientsRoot, clientId, 'client.native.json'), 'utf8')).displayName || displayName; } catch {}
    }
    console.log(`${clientId}\t${displayName}\t${path.join('clients', clientId, 'client.config.ts')}\t${path.join('clients', clientId, 'client.native.json')}\t${status}`);
  }
}

listClients().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
