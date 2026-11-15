import { buildAuthModule, buildUseCases } from './main/container';
import { createApp } from './presentation/http/createApp';

export default createApp({ authFor: buildAuthModule, useCasesFor: buildUseCases });
