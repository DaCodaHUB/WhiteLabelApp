# White Label App

A React Native and TypeScript portfolio showcase. Demo and Sample Cafe share one app shell, with distinct branding and native identifiers. Demo uses a secure WebView bridge to open the Android share sheet.

See the [portfolio scope and validation report](docs/portfolio-scope-reduction.md) for the current device and build results.

## Architecture

The shared app is organized by responsibility.

- `src/infrastructure`: platform adapters for linking and sharing.
- `src/app`: composition root, providers, validation, and client configuration.
- `src/presentation`: navigation, screens, components, and theme exports.
- `clients/<client-id>/assets`: client-owned source artwork; preparation generates runtime and native copies.

## Client packaging

From a fresh checkout, use the Node version in `.nvmrc` and prepare Demo before running the development checks. Preparation supplies the generated module imported by the app and its startup test.

```sh
npm ci
npm run client:prepare -- demo development
npm run lint
npm run typecheck
npm test -- --runInBand
```

Clients are isolated under `clients/<client-id>/`; no global search-and-replace is used. Each directory contains `client.config.ts` (runtime features and branding), `client.native.json` (build identifiers), `environment.development.ts` and `environment.production.ts` (public environment values), plus `assets/README.md`. `src/generated/activeClient.ts` imports exactly one client and one environment, so Metro need not discover every client. Generated files are ignored and must be recreated locally.

Development defaults to the fictional `demo` client. `clients/sample-cafe` is a second development example with different actions, branding, and artwork; it uses fictional business details. Production requires an explicit `--client` or `APP_CLIENT`, rejects `demo`, and requires all production source assets. Selection occurs before Metro/native compilation and is not mutable from JavaScript at runtime. `APP_ENVIRONMENT` may be `development` or `production`; unknown values fail.

Validate, prepare, and run a portfolio client from PowerShell.

```powershell
npm run client:validate -- sample-cafe development
npm run client:prepare -- sample-cafe development
node scripts/clientRun.js android --client sample-cafe --environment development
```

Client and environment selection use `--client <id>` and `--environment <development|production>`. Explicit CLI values take precedence over `APP_CLIENT` and `APP_ENVIRONMENT`; development defaults to Demo when no client is selected. `client:prepare` and `client:validate` also accept positional `<id> <environment>` arguments for compatibility with npm versions that pass those values without their flag names. Missing, conflicting, or unknown selection values fail before preparation. React Native options such as `--deviceId` and `--reset-cache` pass through the runner.

`npm run client:list` prints IDs, display names, paths, and development validation status without dumping configuration. `npm run android`, `ios`, and `start` prepare first; `npm run android:demo` is the explicit demo shortcut. The Android runner passes the selected client's `client.native.json` application ID to React Native CLI with `--appId`, while `MainActivity` stays in the shared `com.whitelabelapp` source namespace. For release preparation use `npm run client:prepare -- --client <id> --environment production` before the native release build.

Android reads `android/client.generated.properties`; Gradle applies the application ID, stable source namespace, and deep-link scheme without rewriting Gradle files. The launcher label comes from generated `client_generated_strings.xml`, with XML escaping. Debug signing remains the stock development setup; production signing is deliberately not configured.

Preparation also emits the ignored `ios/client.generated.xcconfig` with the bundle ID, display name, and URL scheme. The shared `WhiteLabelApp` Xcode target uses checked-in Debug and Release xcconfig wrappers that include both the matching CocoaPods settings and this generated file. `Info.plist` resolves those values at build time. Run `client:prepare` before opening/building the Xcode workspace, and run `bundle exec pod install` on macOS when setting up dependencies. The Xcode target and scheme remain `WhiteLabelApp` for every client; signing and team selection remain separate. Verify the resolved build settings, processed `Info.plist`, URL registration, and signing in Xcode on macOS before release. iOS builds have not been verified from this Windows environment.

Production artwork source files under `clients/<id>/assets/` are `app-icon.png` (exactly 1024×1024 opaque PNG), `splash-logo.png` (at least 1200×1200 transparent PNG), and `brand-logo.png` (at least 512 px wide with transparency). Preparation validates them, resizes Android launcher and splash resources and iOS icon and launch resources, and copies the runtime logo to a fixed generated path used by Metro. No shared asset registry needs editing for a new client. Development generates generic placeholders when all three source files are absent; a partial set is an error. Generated artwork paths are ignored by Git and replaced on every client switch.

Never put credentials in TypeScript, JSON metadata, environment modules, or generated output. Client credential directories, Firebase files, keystores, signing properties, APNs keys/certificates, provisioning profiles, and common private-key formats are ignored. Example/readme files remain trackable; real credential filenames are never created by these tools.

If Metro or a native build shows stale branding, stop Metro, rerun `client:prepare`, confirm the generated paths printed by the command, clean the relevant native build cache, and restart. A failed preparation validates before writing and removes staged temporary files, leaving the last complete generated set intact.

Client IDs and app identifiers distinguish the two builds. Native identifiers are separate from runtime configuration.

Client configuration gates WebContent, Settings, contact, maps, and sharing. Enabled Home actions requiring a disabled feature fail validation. At runtime, the same flags gate navigation and native actions.

## Design system

The reusable UI layer lives in `src/presentation/components` and `src/presentation/theme`. `ThemeProvider` is nested inside `ClientConfigProvider`, derives brand colors from the active configuration, and supplies semantic colors plus shared spacing, typography, radius, and restrained shadow tokens through `useAppTheme()`. Components must not import `defaultConfig` or hardcode an active client's branding.

Shared components currently include `AppScreen`, `AppText`, `AppButton`, `AppCard`, `AppIcon`, `LoadingState` and `ErrorState`. `AppIcon` is the sole presentation-level wrapper around Material Icons. Decorative icons are hidden from assistive technology; any icon-only control added later must have an explicit accessibility label and an approximately 44-point touch target.

## Home actions

The `home.actions` configuration is a discriminated union supporting `web`, `phone`, `email`, `maps`, `externalUrl`, and `nativeScreen`. Actions require a unique ID, title, and supported icon name. Contact actions may use action-specific data or fall back to `contact`; external URLs must use HTTPS. Native destinations use a small config-layer union so configuration does not depend on presentation navigation types.

```ts
home: {
  title: 'Welcome',
  subtitle: 'Choose an option to get started.',
  actions: [
    {id: 'website', title: 'View Website', icon: 'language', type: 'web', route: '/'},
    {id: 'settings', title: 'Settings', icon: 'settings', type: 'nativeScreen', screen: 'settings'},
  ],
}
```

Home action execution is centralized in `src/app/homeActions` and connected to React Navigation by `useHomeActionExecutor`. The Home screen only renders configuration, delegates presses, and displays safe recoverable errors. A per-hook execution lock prevents rapid duplicate actions.

Action behavior and fallback rules:

- `web` builds a URL relative to the configured client base, verifies its hostname against `allowedDomains`, and opens it in the internal WebView.
- `externalUrl` accepts HTTPS only and opens through the system browser.
- `phone` uses the action number before `contact.phone`, removes display punctuation, and opens a `tel:` URL when supported.
- `email` uses the action address before `contact.email`; optional subjects and bodies are URL-encoded in a `mailto:` URL.
- `maps` prefers action map URL, action address, contact map URL, then contact address. Addresses become cross-platform HTTPS map searches.
- `nativeScreen` maps the config-safe `settings` destination to the typed `Settings` navigation route. Web content is deliberately not a native destination because it requires a validated URL.

The linking adapter in `src/infrastructure/linking` is the only home-action layer that imports React Native `Linking`. Unit tests inject fake linking and navigation implementations, so they never invoke device applications.

Client web URLs cannot escape the configured hostname allow-list, lookalike hostnames are rejected, malformed values never reach navigation or Linking, and arbitrary native route strings cannot be injected. Supported external schemes are `https:`, `tel:`, and `mailto:`; map address searches use HTTPS.

To add an action type, extend the `HomeAction` union, configuration validation, the centralized executor and its safe result message, then add pure utility and injected executor tests. Keep platform APIs behind adapters and keep action-type branching out of screens.

## WebView shell

`src/presentation/webview` contains the reusable client-web shell, its controller, and a pure request policy. Only HTTPS pages on an exact configured domain or its subdomains may load internally. Unrelated HTTPS pages, `tel:`, `mailto:`, and `sms:` links are handed to the system through the existing linking adapter. HTTP, malformed, file, and unknown schemes are blocked. `about:blank` is permitted only as a WebView-local navigation and is never accepted as a screen entry URL.

The shell provides initial loading feedback, a navigation progress bar, main-frame and renderer failure recovery, retry, new-window policy enforcement, and Android hardware-back history. Android back first calls WebView history and falls through to React Navigation when no web history exists. External-launch deduplication prevents repeated WebView callbacks from opening the same target concurrently.

Session and security choices are deliberate: DOM storage, normal caching, shared iOS cookies, and Android third-party cookies are enabled for common authenticated website flows. This means website cookies follow platform WebView persistence and privacy behavior; the app never reads or stores raw cookies itself. Incognito is off, mixed content and file URL access are disabled, media requires user action, and WebView debugging is enabled only in development builds. A small main-frame script is injected only when the optional website bridge is enabled.

Native pull-to-refresh is enabled on iOS, where the installed WebView exposes top-aware refresh behavior. Android retains normal webpage scrolling because this WebView release has no equivalent conflict-free native prop and no refresh dependency was added. Retry remains available after failures on both platforms. Proactive offline detection is deferred because NetInfo is not installed; failed main-frame loads show connection guidance without treating subresource failures as offline state.

HTTPS download callbacks are handed to an external application on iOS when supported. There is no native download manager, storage permission, or equivalent reliable Android interception in this milestone. HTML file inputs remain available through the platform WebView defaults, but camera or photo-library capture requires client-specific native usage descriptions and should be tested before enabling those capabilities. No permissions are requested at startup.

### Client website readiness checklist

- Responsive layouts work at common phone and tablet widths.
- Every page and resource uses HTTPS without mixed content.
- Authentication, cookies, MFA, and logout work in an embedded mobile WebView.
- Popups and new-window links resolve correctly under the request policy.
- HTML file inputs behave correctly on each supported platform.
- Payment flows explicitly support embedded WebViews or hand off safely where required.
- Routes are safe to reload and compatible with back/forward navigation.
- External and deep links do not depend on unsupported custom schemes.
- A current privacy policy is reachable.
- Account deletion is available where accounts are offered and platform policy requires it.

Before release, test the exact production domains, intended subdomains, login/session renewal, external links, offline recovery, renderer recovery, hardware back, downloads, uploads, and target-blank behavior on physical Android and iOS devices.

## Native configuration

1. Use Node 22.13+ (the version is captured in `.nvmrc`).
2. Run `npm ci`.
3. On macOS, run `bundle install && bundle exec pod install` from `ios`.
4. Use the client packaging workflow above to select identifiers and branding.

## Commands

```sh
npm run android
npm run ios
npm run lint
npm run typecheck
npm test
```

Configuration and URL utility tests are in `__tests__/clientConfig.test.ts` and `__tests__/clientUrl.test.ts`; run them alone with `npm test -- clientConfig clientUrl`.

## Website bridge

For the portfolio walkthrough, open **View Portfolio → Native Bridge** in Demo. The [native share showcase](docs/portfolio-showcase.md) documents the Android capture and the hosted bridge script change needed for the page's share button.

The optional website bridge is a narrow application-layer gateway from an authorized client page to approved native services. It is disabled by default. Enabling it requires both an explicit allow-list of message types and a bounded message length:

```ts
webBridge: {
  enabled: true,
  allowedMessageTypes: ['openPhone', 'openNative'],
  maxMessageLength: 8192,
}
```

Version 1 supports `openPhone`, `openEmail`, `openMap`, `openExternal`, `share`, and `openNative`. Each type must also pass its relevant feature flag. Native destinations use the typed destination mapping and cannot contain arbitrary React Navigation route names. External and map URLs require HTTPS.

Messages are processed only while the current main-frame page is HTTPS and belongs to `website.allowedDomains`. A native-generated, per-WebView capability is installed only in the main frame through `window.WhiteLabelBridge`; raw `window.ReactNativeWebView.postMessage` calls, including calls from embedded frames, cannot invoke privileged actions. The reported message URL is checked as an additional restriction, but is not treated as proof of frame identity because Android WebView implementations differ. `about:blank`, malformed URLs, external pages, disabled bridges, and unlisted types are rejected. Unknown JSON fields are tolerated for forward-compatible website clients, but every recognized field is type-checked and length-bounded. Raw messages and native errors are neither persisted nor returned. A business must trust scripts running in its own top-level page; the bridge cannot distinguish a compromised same-origin script from the business's script.

Website code may use the following pattern while retaining its normal browser fallback:

```js
function sendAppMessage(message) {
  if (!window.WhiteLabelBridge) return false;
  window.WhiteLabelBridge.postMessage(JSON.stringify({version: 1, ...message}));
  return true;
}

sendAppMessage({id: 'request-123', type: 'openPhone'});
sendAppMessage({id: 'request-124', type: 'openNative', destination: 'settings'});
```

When a request supplies an ID, the app dispatches a narrowly scoped response event:

```js
window.addEventListener('freelanceAppBridgeResponse', event => {
  const result = event.detail; // status, requestId, and safe code/message when applicable
});
```

Responses are JSON-serialized with executable-context escaping and never include configuration, personal data, credentials, or raw errors. IDs are deduplicated briefly in memory; messages without IDs execute without strong deduplication and receive no response.

Retired notification identity requests receive `MESSAGE_NOT_ALLOWED` with the validated request ID when sent through the authorized bridge. No identity data is used.

The bridge does not expose evaluation, storage, files, device identifiers, clipboard, contacts, cameras, unrestricted navigation, or arbitrary native functions. The main-frame wrapper uses `react-native-webview`'s transport and requires the `react-native-get-random-values` native module for a secure capability; install native dependencies before building. Existing websites calling `window.ReactNativeWebView.postMessage` directly must switch to `window.WhiteLabelBridge.postMessage` for privileged messages.

To add a future message type, extend the config union and parser, add an injected executor branch, define feature authorization, add it to runtime config validation, and cover parser, authorization, execution, response, and WebView transport behavior. Run bridge tests with `npm test -- webBridge AppWebView`.

## Development demo and Test Lab

Development defaults to the packaged `clients/demo` definition, whose website home route is `https://dacodahub.github.io/mobile-demo/`. `client:prepare` generates the active client module, and `App.tsx` supplies that configuration to Test Lab through the same provider used by the rest of the app. Demo has fictional 555 contact data. There is no separate development demo configuration. Release builds use an explicit non-demo client and its production environment.

When Metro runs with `__DEV__ === true`, the Home screen shows **Open Test Lab** and the navigator registers the typed `TestLab` route. The screen and route are guarded by the compile-time development constant; no Test Lab entry point is rendered in release builds.

Test Lab shows the active client, WebView host, and bridge state. Its three actions open the configured site, check that HTTP is blocked, and exercise the maps handoff.

To use it:

1. Start a development build with `npm run android` or `npm run ios`.
2. Open **Open Test Lab** from Home.
3. Run an action and inspect its safe status under **Last result**.

The maps handoff depends on which apps are installed on the device.

Run the focused development-environment tests with `npm test -- testLab`. They verify the build guard, action delegation, insecure URL rejection, and fictional-data constraints.
