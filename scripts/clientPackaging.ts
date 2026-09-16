import * as fs from 'fs';
import * as path from 'path';
import {validateClientConfig} from '../src/app/config/validateClientConfig';
import type {ClientConfig} from '../src/app/config/types';

export type ClientEnvironment = 'development' | 'production';
export type ClientNativeConfig = {
  clientId: string;
  displayName: string;
  android: {applicationId: string; namespace: string; deepLinkScheme: string};
  ios: {bundleIdentifier: string; deepLinkScheme: string};
};
export type ClientEnvironmentConfig = {
  website: {baseUrl: string; allowedDomains: string[]};
  analyticsEnabled: boolean;
  logging: 'debug' | 'error';
};
export type ResolveClientSelectionOptions = {environment: ClientEnvironment; clientId?: string; cwd?: string};
export type CreateClientDefinitionOptions = {workspaceRoot: string; clientId: string; displayName: string; androidApplicationId: string; iosBundleIdentifier: string};
export type ValidateClientProjectOptions = {workspaceRoot: string; clientId: string; environment: ClientEnvironment};

const CLIENT_ID = /^[a-z][a-z0-9-]{1,39}$/;
const ANDROID_ID = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;
const IOS_ID = /^[A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9][A-Za-z0-9-]*)+$/;
const SCHEME = /^[a-z][a-z0-9+.-]*$/;
const NATIVE_FIELDS = ['clientId', 'displayName', 'android', 'ios'] as const;
const CREDENTIAL_NAMES = /^(google-services\.json|GoogleService-Info\.plist|secrets\.properties|.*\.(?:keystore|jks|p12|pfx|pem|key))$/i;

function requireRecord(value: unknown, field: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} must be an object`);
}
function textField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new Error(`${key} is required`);
  return value;
}
export function parseClientNativeConfig(value: unknown): ClientNativeConfig {
  requireRecord(value, 'native metadata');
  for (const key of NATIVE_FIELDS) if (!(key in value)) throw new Error(`${key} is required`);
  requireRecord(value.android, 'android'); requireRecord(value.ios, 'ios');
  if ('targetName' in value.ios || 'schemeName' in value.ios) throw new Error('iOS targetName and schemeName are not client-specific; use the shared WhiteLabelApp target and scheme');
  const config: ClientNativeConfig = {
    clientId: textField(value, 'clientId'), displayName: textField(value, 'displayName'),
    android: {applicationId: textField(value.android, 'applicationId'), namespace: textField(value.android, 'namespace'), deepLinkScheme: textField(value.android, 'deepLinkScheme')},
    ios: {bundleIdentifier: textField(value.ios, 'bundleIdentifier'), deepLinkScheme: textField(value.ios, 'deepLinkScheme')},
  };
  validateClientNativeConfig(config); return config;
}
export function validateClientNativeConfig(config: ClientNativeConfig): void {
  if (!CLIENT_ID.test(config.clientId)) throw new Error('clientId must be lowercase kebab-case (2-40 characters)');
  if (!config.displayName.trim() || config.displayName !== config.displayName.trim()) throw new Error('displayName is required and must not have surrounding whitespace');
  if (config.displayName.length > 48) throw new Error('displayName is too long (maximum 48 characters)');
  if (/[\r\n\\]/.test(config.displayName) || config.displayName.includes('//') || config.displayName.includes('$(')) throw new Error('displayName contains unsupported Xcode configuration syntax');
  if (!ANDROID_ID.test(config.android.applicationId)) throw new Error('android.applicationId is invalid; use lowercase dot-separated identifiers');
  if (!ANDROID_ID.test(config.android.namespace)) throw new Error('android.namespace is invalid; use lowercase dot-separated identifiers');
  if (!IOS_ID.test(config.ios.bundleIdentifier)) throw new Error('ios.bundleIdentifier is invalid');
  if (!SCHEME.test(config.android.deepLinkScheme)) throw new Error('android.deepLinkScheme is invalid');
  if (!SCHEME.test(config.ios.deepLinkScheme)) throw new Error('ios.deepLinkScheme is invalid');
  const identifiers = [config.android.applicationId, config.android.namespace, config.ios.bundleIdentifier];
  if (identifiers.some(item => /placeholder|changeme|your[-_.]?company/i.test(item))) throw new Error('native metadata contains a reserved placeholder value');
}

export function resolveClientSelection(options: ResolveClientSelectionOptions): {clientId: string; environment: ClientEnvironment} {
  const supplied = options.clientId ?? process.env.APP_CLIENT;
  const clientId = supplied?.trim() || (options.environment === 'development' ? 'demo' : '');
  if (!clientId) throw new Error('Production builds require an explicit client via --client or APP_CLIENT.');
  if (!CLIENT_ID.test(clientId)) throw new Error(`Invalid client ID '${clientId}'.`);
  if (!fs.statSync(path.join(path.resolve(options.cwd ?? process.cwd()), 'clients', clientId), {throwIfNoEntry: false})?.isDirectory()) {
    throw new Error(`Unknown client '${clientId}'. Expected clients/${clientId}.`);
  }
  return {clientId, environment: options.environment};
}

function quoteTs(value: string): string { return JSON.stringify(value); }
function environmentTemplate(baseUrl: string, logging: 'debug' | 'error'): string {
  const hostname = new URL(baseUrl).hostname;
  return `import type {ClientEnvironmentConfig} from '../../scripts/clientPackaging';\n\nexport const environmentConfig = {\n  website: {baseUrl: ${quoteTs(baseUrl)}, allowedDomains: [${quoteTs(hostname)}]},\n  analyticsEnabled: false,\n  logging: ${quoteTs(logging)},\n} satisfies ClientEnvironmentConfig;\n`;
}
export function createClientDefinition(options: CreateClientDefinitionOptions): {created: string[]; files: string[]} {
  const native = parseClientNativeConfig({clientId: options.clientId, displayName: options.displayName, android: {applicationId: options.androidApplicationId, namespace: 'com.whitelabelapp', deepLinkScheme: options.clientId.replace(/-/g, '')}, ios: {bundleIdentifier: options.iosBundleIdentifier, deepLinkScheme: options.clientId.replace(/-/g, '')}});
  const clientDir = path.join(path.resolve(options.workspaceRoot), 'clients', options.clientId);
  if (fs.existsSync(clientDir)) return {created: [], files: []};
  const runtime = `import {defaultConfig} from '../../src/app/config/defaultConfig';\nimport type {ClientConfig} from '../../src/app/config/types';\n\nexport const clientConfig = {\n  ...defaultConfig,\n  clientId: ${quoteTs(options.clientId)},\n  appName: ${quoteTs(options.displayName)},\n  home: {...defaultConfig.home, title: ${quoteTs(options.displayName)}},\n  storage: {namespace: ${quoteTs(options.clientId)}},\n} satisfies ClientConfig;\n`;
  const files = new Map<string, string>([
    ['client.config.ts', runtime], ['client.native.json', JSON.stringify(native, null, 2) + '\n'],
    ['environment.development.ts', environmentTemplate('https://example.com', 'debug')], ['environment.production.ts', environmentTemplate('https://example.com', 'error')],
    ['assets/README.md', assetReadme(options.clientId)],
  ]);
  const staging = `${clientDir}.creating-${process.pid}`;
  try {
    for (const [relative, content] of files) { const target = path.join(staging, relative); fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, content, {flag: 'wx'}); }
    fs.renameSync(staging, clientDir);
  } catch (error) { fs.rmSync(staging, {recursive: true, force: true}); throw error; }
  return {created: [...files.keys()], files: [...files.keys()].map(item => path.join(clientDir, item))};
}
function assetReadme(clientId: string): string { return `# ${clientId} assets\n\nRequired production source artwork (PNG, sRGB):\n\n- \`app-icon.png\`: 1024 x 1024, opaque, no rounded corners.\n- \`splash-logo.png\`: at least 1200 x 1200, transparent background.\n- \`brand-logo.png\`: at least 512 px wide, transparent background.\n\nDemo/development builds may use the existing native placeholders. Add assets to the explicit static registry before release; never construct a runtime \`require()\` path.\n`; }

function loadRuntimeConfig(workspaceRoot: string, clientId: string): ClientConfig {
  const modulePath = path.join(workspaceRoot, 'clients', clientId, 'client.config.ts');
  const loaded = require(modulePath) as {clientConfig?: ClientConfig};
  if (!loaded.clientConfig) throw new Error('Runtime config must export clientConfig');
  return loaded.clientConfig;
}
function loadEnvironmentConfig(workspaceRoot: string, clientId: string, environment: ClientEnvironment): ClientEnvironmentConfig {
  const file = path.join(workspaceRoot, 'clients', clientId, `environment.${environment}.ts`);
  if (!fs.existsSync(file)) throw new Error(`Environment config missing: environment.${environment}.ts`);
  const loaded = require(file) as {environmentConfig?: unknown}; requireRecord(loaded.environmentConfig, 'environmentConfig');
  const website = loaded.environmentConfig.website; requireRecord(website, 'environmentConfig.website');
  const baseUrl = textField(website, 'baseUrl'); const domains = website.allowedDomains;
  if (!Array.isArray(domains) || domains.length === 0 || domains.some(item => typeof item !== 'string' || !item.trim())) throw new Error('environmentConfig.website.allowedDomains is invalid');
  if (typeof loaded.environmentConfig.analyticsEnabled !== 'boolean') throw new Error('environmentConfig.analyticsEnabled must be boolean');
  if (loaded.environmentConfig.logging !== 'debug' && loaded.environmentConfig.logging !== 'error') throw new Error('environmentConfig.logging is invalid');
  const url = new URL(baseUrl); if (url.protocol !== 'https:') throw new Error('environment website must use HTTPS');
  return {website: {baseUrl, allowedDomains: domains as string[]}, analyticsEnabled: loaded.environmentConfig.analyticsEnabled, logging: loaded.environmentConfig.logging};
}
export function validateClientProject(options: ValidateClientProjectOptions): {runtime: ClientConfig; native: ClientNativeConfig; environment: ClientEnvironmentConfig} {
  const root = path.resolve(options.workspaceRoot); const dir = path.join(root, 'clients', options.clientId);
  if (!fs.statSync(dir, {throwIfNoEntry: false})?.isDirectory()) throw new Error(`Client directory not found: ${options.clientId}`);
  for (const relative of ['client.config.ts', 'client.native.json', 'assets', `environment.${options.environment}.ts`]) if (!fs.existsSync(path.join(dir, relative))) throw new Error(`Required client path missing: ${relative}`);
  const runtime = loadRuntimeConfig(root, options.clientId); validateClientConfig(runtime);
  const native = parseClientNativeConfig(JSON.parse(fs.readFileSync(path.join(dir, 'client.native.json'), 'utf8')));
  const environment = loadEnvironmentConfig(root, options.clientId, options.environment);
  if (runtime.clientId !== options.clientId || native.clientId !== options.clientId || runtime.clientId !== native.clientId) throw new Error('Client IDs in directory, runtime config, and native metadata must match');
  for (const domain of environment.website.allowedDomains) if (domain !== domain.toLowerCase() || /[:/\s]/.test(domain)) throw new Error(`Invalid allowed domain '${domain}'`);
  const files = fs.readdirSync(dir, {recursive: true, withFileTypes: true});
  const credential = files.find(entry => entry.isFile() && CREDENTIAL_NAMES.test(entry.name)); if (credential) throw new Error(`Credential-like file must not be stored in client directory: ${credential.name}`);
  if (options.environment === 'production') {
    if (options.clientId === 'demo') throw new Error('The demo client is development-only and cannot be prepared for production');
    for (const asset of ['app-icon.png', 'splash-logo.png', 'brand-logo.png']) if (!fs.existsSync(path.join(dir, 'assets', asset))) throw new Error(`Production validation requires assets/${asset}`);
  }
  return {runtime, native, environment};
}

export function activeClientContent(clientId: string, environment: ClientEnvironment): string {
  return `// AUTO-GENERATED by client:prepare. DO NOT EDIT.\n// Contains public configuration only.\nimport {clientConfig} from '../../clients/${clientId}/client.config';\nimport {environmentConfig} from '../../clients/${clientId}/environment.${environment}';\nimport type {ClientConfig} from '../app/config/types';\n\nexport const activeClientConfig = {\n  ...clientConfig,\n  website: {...clientConfig.website, ...environmentConfig.website},\n} satisfies ClientConfig;\n`;
}
function propertiesEscape(value: string): string { return value.replace(/\\/g, '\\\\').replace(/([:=#!])/g, '\\$1').replace(/\r|\n/g, ''); }
function xmlEscape(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
export function androidPropertiesContent(clientId: string, displayName: string, android: ClientNativeConfig['android']): string {
  return [`CLIENT_ID=${propertiesEscape(clientId)}`, `CLIENT_DISPLAY_NAME=${propertiesEscape(displayName)}`, `CLIENT_ANDROID_APPLICATION_ID=${propertiesEscape(android.applicationId)}`, `CLIENT_ANDROID_NAMESPACE=${propertiesEscape(android.namespace)}`, `CLIENT_DEEP_LINK_SCHEME=${propertiesEscape(android.deepLinkScheme)}`, ''].join('\n');
}
export function androidStringsContent(displayName: string): string { return `<?xml version="1.0" encoding="utf-8"?>\n<!-- AUTO-GENERATED by client:prepare. DO NOT EDIT. -->\n<resources>\n    <string name="app_name">${xmlEscape(displayName)}</string>\n</resources>\n`; }
export function iosConfigContent(clientId: string, displayName: string, ios: ClientNativeConfig['ios']): string {
  return `// AUTO-GENERATED by client:prepare. macOS/Xcode verification required.\nCLIENT_ID = ${clientId}\nCLIENT_DISPLAY_NAME = ${displayName}\nCLIENT_IOS_BUNDLE_IDENTIFIER = ${ios.bundleIdentifier}\nCLIENT_IOS_DEEP_LINK_SCHEME = ${ios.deepLinkScheme}\n`;
}
export function writeFilesAtomically(files: ReadonlyArray<{path: string; content: string}>): void {
  const changedFiles = files.filter(file => !fs.existsSync(file.path) || fs.readFileSync(file.path, 'utf8') !== file.content);
  if (changedFiles.length === 0) return;
  const staged: string[] = []; const backups: Array<{target: string; backup: string}> = []; const installed: string[] = [];
  try {
    for (const file of changedFiles) { fs.mkdirSync(path.dirname(file.path), {recursive: true}); const temp = `${file.path}.${process.pid}.tmp`; fs.writeFileSync(temp, file.content, {flag: 'wx'}); staged.push(temp); }
    for (const file of changedFiles) if (fs.existsSync(file.path)) { const backup = `${file.path}.${process.pid}.bak`; fs.copyFileSync(file.path, backup, fs.constants.COPYFILE_EXCL); backups.push({target: file.path, backup}); }
    for (let index = 0; index < changedFiles.length; index += 1) {
      const target = changedFiles[index]?.path as string; const temp = staged[index] as string;
      if (process.platform === 'win32') { fs.copyFileSync(temp, target); fs.rmSync(temp); } else { fs.renameSync(temp, target); }
      installed.push(target);
    }
    for (const item of backups) fs.rmSync(item.backup, {force: true});
  } catch (error) {
    for (const temp of staged) fs.rmSync(temp, {force: true});
    for (const target of installed) fs.rmSync(target, {force: true});
    for (const item of backups) if (fs.existsSync(item.backup)) { fs.copyFileSync(item.backup, item.target); fs.rmSync(item.backup, {force: true}); }
    throw error;
  }
}

// Compatibility wrappers used by focused tests and external scripts.
export function generateActiveClientModule(options: {workspaceRoot?: string; clientId: string; environment: ClientEnvironment; outputFile: string}): string { const content = activeClientContent(options.clientId, options.environment); fs.mkdirSync(path.dirname(options.outputFile), {recursive: true}); fs.writeFileSync(options.outputFile, content); return content; }
export function generateAndroidClientProperties(options: {workspaceRoot?: string; clientId: string; displayName: string; android: ClientNativeConfig['android']; outputFile: string}): string { const content = androidPropertiesContent(options.clientId, options.displayName, options.android); fs.mkdirSync(path.dirname(options.outputFile), {recursive: true}); fs.writeFileSync(options.outputFile, content); return content; }
