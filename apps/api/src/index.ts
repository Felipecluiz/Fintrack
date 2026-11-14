import { buildUseCases } from './main/container';
import { createApp } from './presentation/http/createApp';

export default createApp(buildUseCases);
