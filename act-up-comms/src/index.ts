import { createApp } from './components';
import { configureServices } from './services';
import { initializeUtils } from './utils';

const app = createApp();
const services = configureServices();
const utils = initializeUtils();

app.start();