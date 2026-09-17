import {executeHomeAction} from '../../app/homeActions';
import {createNotificationRouter} from '../../app/notifications';
import {evaluateWebRequest} from '../../presentation/webview';
import type {TestLabActionId, TestLabDependencies, TestLabExecutionResult, TestLabHomeAction} from './types';

function action(id: TestLabActionId): TestLabHomeAction | undefined {
  switch (id) {
    case 'allowedRoute': return {id, title: 'Allowed client route', icon: 'language', type: 'web', route: '/'};
    case 'externalHttps': return {id, title: 'External HTTPS URL', icon: 'open-in-new', type: 'externalUrl', url: 'https://outside.example'};
    case 'blockedHttp': return {id, title: 'Blocked HTTP URL', icon: 'open-in-new', type: 'externalUrl', url: 'http://insecure.example'};
    case 'phone': return {id, title: 'Phone action', icon: 'phone', type: 'phone'};
    case 'email': return {id, title: 'Email action', icon: 'email', type: 'email', subject: 'Example test message'};
    case 'maps': return {id, title: 'Maps action', icon: 'explore', type: 'maps'};
    case 'settings': return {id, title: 'Settings', icon: 'settings', type: 'nativeScreen', screen: 'settings'};
    default: return undefined;
  }
}

export async function executeTestLabAction(id: TestLabActionId, dependencies: TestLabDependencies): Promise<TestLabExecutionResult> {
  if (id === 'internalWebView') {
    const result = await executeHomeAction({id, title: 'Internal WebView', icon: 'language', type: 'web', route: dependencies.config.website.routes.home}, {
      config: dependencies.config, linking: dependencies.linking, navigate: dependencies.homeNavigation,
    });
    return {status: result.status};
  }
  if (id === 'lookalikeDomain') {
    const decision = evaluateWebRequest('https://fakedemo.example', dependencies.config.website.allowedDomains);
    return {status: decision.type === 'allowInternal' ? 'unexpected' : 'rejected', detail: decision.type};
  }
  if (id.startsWith('notification')) {
    const router = createNotificationRouter({config: dependencies.config, navigation: dependencies.notificationNavigation, linking: dependencies.linking});
    const payload: unknown = id === 'notificationWeb'
      ? {version: 1, type: 'openWeb', route: '/', title: 'Example services'}
      : id === 'notificationNative'
        ? {version: 1, type: 'openNative', destination: 'settings'}
        : id === 'notificationHome'
          ? {version: 1, type: 'home'}
          : {version: 1, type: 'unsupported-test-payload'};
    const result = await router.handle(payload);
    return {status: result.status, detail: 'reason' in result ? result.reason : undefined};
  }
  const selected = action(id);
  if (!selected) return {status: 'unsupported'};
  const result = await executeHomeAction(selected, {
    config: dependencies.config,
    linking: dependencies.linking,
    navigate: dependencies.homeNavigation,
  });
  return {status: result.status};
}
