import combineRouters from 'koa-combine-routers';

import page from './page';
import auth from './auth';
import api from './api';
import application from './application';
import scenario from './scenario';
import workflow from './workflow';
import performance from './performance';
import load from './load';

export default combineRouters([
  page,
  auth,
  application,
  scenario,
  api,
  workflow,
  performance,
  load
]);
