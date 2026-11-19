import {executeHomeAction} from '../../app/homeActions';
import {evaluateWebRequest} from '../../presentation/webview';
import type {TestLabActionId, TestLabDependencies, TestLabExecutionResult} from './types';

export async function executeTestLabAction(id: TestLabActionId, {config, linking, homeNavigation}: TestLabDependencies): Promise<TestLabExecutionResult> {
  if (id === 'blockedHttp') {
    const decision = evaluateWebRequest('http://insecure.example', config.website.allowedDomains);
    return {status: decision.type === 'block' ? 'rejected' : 'unexpected', detail: decision.type};
  }

  const action = id === 'internalWebView'
    ? {id, title: 'Internal WebView', icon: 'language', type: 'web', route: config.website.routes.home} as const
    : {id, title: 'Maps action', icon: 'explore', type: 'maps'} as const;
  const result = await executeHomeAction(action, {config, linking, navigate: homeNavigation});
  return {status: result.status};
}
