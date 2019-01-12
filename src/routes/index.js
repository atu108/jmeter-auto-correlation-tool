import combineRouters from 'koa-combine-routers';

import page from './page';
import auth from './auth';
import api from './api';
import project from './project';
import scenario from './scenario';
import run from './run';
import session from './session';

export default combineRouters([
  page,
  auth,
  project,
  scenario,
  run,
    session
]);
