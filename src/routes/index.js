import combineRouters from 'koa-combine-routers';

import page from './page';
import auth from './auth';
import api from './api';
import project from './project';
import scenario from './scenario';
import run from './run';

export default combineRouters([
  page,
  auth,
  api,
  project,
  scenario,
  run
]);
