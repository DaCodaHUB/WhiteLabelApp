import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createClientDefinition,
  generateActiveClientModule,
  generateAndroidClientProperties,
  iosConfigContent,
  parseClientArguments,
  parseClientNativeConfig,
  resolveClientSelection,
  validateClientNativeConfig,
  validateClientProject,
} from '../scripts/clientPackaging';

describe('client packaging helpers', () => {
  it('accepts a valid native metadata shape', () => {
    expect(() => validateClientNativeConfig({
      clientId: 'demo',
      displayName: 'DaCodaHub Demo',
      android: {
        applicationId: 'com.dacodahub.whitelabel.demo',
        namespace: 'com.dacodahub.whitelabel',
        deepLinkScheme: 'dacodahubdemo',
      },
      ios: {
        bundleIdentifier: 'com.dacodahub.whitelabel.demo',
        deepLinkScheme: 'dacodahubdemo',
      },
    })).not.toThrow();
  });

  it('rejects invalid native metadata', () => {
    expect(() => validateClientNativeConfig({
      clientId: 'demo',
      displayName: 'This display name is much too long for the supported policy',
      android: {
        applicationId: 'com.Demo.App',
        namespace: 'com.demo app',
        deepLinkScheme: 'Invalid Scheme',
      },
      ios: {
        bundleIdentifier: 'bad id',
        deepLinkScheme: 'BadScheme',
      },
    })).toThrow();
  });

  it('rejects obsolete per-client Xcode target and scheme metadata', () => {
    expect(() => parseClientNativeConfig({
      clientId: 'sample-cafe', displayName: 'Sample Cafe',
      android: {applicationId: 'com.example.samplecafe', namespace: 'com.whitelabelapp', deepLinkScheme: 'samplecafe'},
      ios: {bundleIdentifier: 'com.example.samplecafe', deepLinkScheme: 'samplecafe', targetName: 'SampleCafe'},
    })).toThrow(/not client-specific/);
  });

  it('rejects display names that would change xcconfig syntax', () => {
    expect(() => validateClientNativeConfig({
      clientId: 'sample-cafe', displayName: 'Cafe // Other setting',
      android: {applicationId: 'com.example.samplecafe', namespace: 'com.whitelabelapp', deepLinkScheme: 'samplecafe'},
      ios: {bundleIdentifier: 'com.example.samplecafe', deepLinkScheme: 'samplecafe'},
    })).toThrow(/Xcode configuration syntax/);
  });

  it('defaults development selection to demo and requires explicit selection in production', () => {
    expect(resolveClientSelection({environment: 'development', cwd: process.cwd(), env: {}})).toMatchObject({clientId: 'demo'});
    expect(() => resolveClientSelection({environment: 'production', cwd: process.cwd(), env: {}})).toThrow(/explicit/i);
    expect(resolveClientSelection({environment: 'production', clientId: 'demo', cwd: process.cwd()})).toMatchObject({clientId: 'demo'});
    expect(() => validateClientProject({workspaceRoot: process.cwd(), clientId: 'demo', environment: 'production'})).toThrow(/development-only/);
  });

  it('parses named and positional client selection without dropping an explicit value', () => {
    expect(parseClientArguments(['--client', 'sample-cafe', '--environment', 'development'])).toEqual({clientId: 'sample-cafe', environment: 'development', forwardedArgs: []});
    expect(parseClientArguments(['sample-cafe', 'development'])).toEqual({clientId: 'sample-cafe', environment: 'development', forwardedArgs: []});
    expect(parseClientArguments(['--client=demo', '--environment=development'])).toEqual({clientId: 'demo', environment: 'development', forwardedArgs: []});
    expect(resolveClientSelection({environment: 'development', clientId: 'sample-cafe', env: {APP_CLIENT: 'demo'}, cwd: process.cwd()})).toMatchObject({clientId: 'sample-cafe'});
  });

  it.each([
    [['--client'], /--client requires a value/],
    [['--client', '--environment', 'development'], /--client requires a value/],
    [['--environment'], /--environment requires a value/],
    [['--environment', 'staging'], /Unsupported environment/],
    [['--client', 'demo', '--client', 'sample-cafe'], /Conflicting --client/],
    [['--environment', 'development', '--environment', 'production'], /Conflicting --environment/],
    [['--client-id', 'sample-cafe'], /Unknown client argument/],
  ])('rejects malformed selection arguments %j', (args, message) => {
    expect(() => parseClientArguments(args as string[])).toThrow(message as RegExp);
  });

  it('rejects unknown clients and never substitutes Demo', () => {
    expect(() => resolveClientSelection({environment: 'development', clientId: 'sample-caffee', env: {APP_CLIENT: 'demo'}, cwd: process.cwd()})).toThrow(/Unknown client/);
    expect(() => resolveClientSelection({environment: 'development', clientId: '', env: {APP_CLIENT: 'sample-cafe'}, cwd: process.cwd()})).toThrow(/cannot be empty/);
  });

  it('creates a client directory structure without overwriting existing files', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'client-create-'));
    const result = createClientDefinition({
      workspaceRoot: tempRoot,
      clientId: 'sample-business',
      displayName: 'Sample Business',
      androidApplicationId: 'com.example.samplebusiness',
      iosBundleIdentifier: 'com.example.samplebusiness',
    });

    expect(result.created).toEqual(['client.config.ts', 'client.native.json', 'environment.development.ts', 'environment.production.ts', 'assets/README.md']);
    expect(fs.existsSync(path.join(tempRoot, 'clients', 'sample-business', 'client.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempRoot, 'clients', 'sample-business', 'client.native.json'))).toBe(true);
    expect(JSON.parse(fs.readFileSync(path.join(tempRoot, 'clients', 'sample-business', 'client.native.json'), 'utf8')).ios).toEqual({
      bundleIdentifier: 'com.example.samplebusiness', deepLinkScheme: 'samplebusiness',
    });

    const second = createClientDefinition({
      workspaceRoot: tempRoot,
      clientId: 'sample-business',
      displayName: 'Sample Business',
      androidApplicationId: 'com.example.samplebusiness',
      iosBundleIdentifier: 'com.example.samplebusiness',
    });

    expect(second.created).toEqual([]);
  });

  it('generates client-specific iOS values consumed by the shared Xcode target with Pods settings', () => {
    const generated = iosConfigContent('sample-cafe', 'Sample Cafe & Co', {
      bundleIdentifier: 'com.example.samplecafe', deepLinkScheme: 'samplecafe',
    });
    expect(generated).toContain('CLIENT_DISPLAY_NAME = Sample Cafe & Co');
    expect(generated).toContain('CLIENT_IOS_BUNDLE_IDENTIFIER = com.example.samplecafe');
    expect(generated).toContain('CLIENT_IOS_DEEP_LINK_SCHEME = samplecafe');
    expect(generated).not.toMatch(/TARGET_NAME|SCHEME_NAME/);
    expect(iosConfigContent('other-client', 'Other Client', {
      bundleIdentifier: 'com.example.otherclient', deepLinkScheme: 'otherclient',
    })).not.toBe(generated);

    const iosRoot = path.join(process.cwd(), 'ios');
    const debug = fs.readFileSync(path.join(iosRoot, 'Client.Debug.xcconfig'), 'utf8');
    const release = fs.readFileSync(path.join(iosRoot, 'Client.Release.xcconfig'), 'utf8');
    const project = fs.readFileSync(path.join(iosRoot, 'WhiteLabelApp.xcodeproj', 'project.pbxproj'), 'utf8');
    const plist = fs.readFileSync(path.join(iosRoot, 'WhiteLabelApp', 'Info.plist'), 'utf8');
    expect(debug).toContain('#include "Pods/Target Support Files/Pods-WhiteLabelApp/Pods-WhiteLabelApp.debug.xcconfig"');
    expect(release).toContain('#include "Pods/Target Support Files/Pods-WhiteLabelApp/Pods-WhiteLabelApp.release.xcconfig"');
    expect(debug).toContain('#include "client.generated.xcconfig"');
    expect(release).toContain('#include "client.generated.xcconfig"');
    expect(project).toMatch(/baseConfigurationReference = .*Client\.Debug\.xcconfig/);
    expect(project).toMatch(/baseConfigurationReference = .*Client\.Release\.xcconfig/);
    expect(project.match(/PRODUCT_BUNDLE_IDENTIFIER = "\$\(CLIENT_IOS_BUNDLE_IDENTIFIER\)";/g)).toHaveLength(2);
    expect(plist).toContain('<string>$(CLIENT_DISPLAY_NAME)</string>');
    expect(plist).toContain('<key>CFBundleURLSchemes</key>');
    expect(plist).toContain('<string>$(CLIENT_IOS_DEEP_LINK_SCHEME)</string>');
  });

  it('generates deterministic active client output and safe Android properties', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'client-generate-'));
    const outputFile = path.join(tempRoot, 'src', 'generated', 'activeClient.ts');
    const propsFile = path.join(tempRoot, 'android', 'client.generated.properties');

    const result = generateActiveClientModule({
      workspaceRoot: tempRoot,
      clientId: 'demo',
      environment: 'development',
      outputFile,
    });
    const props = generateAndroidClientProperties({
      workspaceRoot: tempRoot,
      clientId: 'demo',
      displayName: 'DaCodaHub Demo & Co',
      android: {
        applicationId: 'com.dacodahub.whitelabel.demo',
        namespace: 'com.dacodahub.whitelabel',
        deepLinkScheme: 'dacodahubdemo',
      },
      outputFile: propsFile,
    });

    expect(result).toMatch(/activeClientConfig/);
    expect(result).toContain("logo: require('./brand-logo.png')");
    expect(props).toContain('CLIENT_DISPLAY_NAME=DaCodaHub Demo & Co');
    expect(fs.existsSync(outputFile)).toBe(true);
    expect(fs.existsSync(propsFile)).toBe(true);
  });

  it('validates demo client structure and surfaces missing runtime or asset requirements', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'client-validate-'));
    const clientDir = path.join(tempRoot, 'clients', 'demo');
    fs.mkdirSync(clientDir, {recursive: true});
    fs.writeFileSync(path.join(clientDir, 'client.native.json'), JSON.stringify({
      clientId: 'demo',
      displayName: 'DaCodaHub Demo',
      android: {applicationId: 'com.demo.app', namespace: 'com.demo', deepLinkScheme: 'demo'},
      ios: {bundleIdentifier: 'com.demo.app', deepLinkScheme: 'demo'},
    }, null, 2));

    expect(() => validateClientProject({workspaceRoot: tempRoot, clientId: 'demo', environment: 'development'})).toThrow();
    expect(() => validateClientProject({workspaceRoot: tempRoot, clientId: 'demo', environment: 'production'})).toThrow();
  });
});
