import { StudioApp } from './src/application/StudioApp';
import { createStudioApi } from './src/data/createStudioApi';

const api = createStudioApi();

export default function App() {
  return <StudioApp api={api} />;
}
