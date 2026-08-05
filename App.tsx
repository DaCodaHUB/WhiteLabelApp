import React from 'react';
import {validateClientConfig} from './src/app/config/validateClientConfig';
import {AppProviders} from './src/app/providers/AppProviders';
import {RootNavigator} from './src/presentation/navigation/RootNavigator';
import {activeClientConfig} from './src/generated/activeClient';

const activeConfig = activeClientConfig;
validateClientConfig(activeConfig);

function App(): React.JSX.Element {
  return (
    <AppProviders config={activeConfig}>
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
