import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StudioApp } from './src/application/StudioApp';
import { createStudioApi } from './src/data/createStudioApi';

const api = createStudioApi();

export default function App() {
  return (
    <SafeAreaProvider>
      <StudioApp api={api} />
    </SafeAreaProvider>
  );
}
