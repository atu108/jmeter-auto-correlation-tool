import Router from 'koa-router';
import {appAuth as auth} from '../middlewares/auth';

import ProjectController from "../controllers/ProjectController";

const router = new Router({
  prefix: '/app'
});

router.get('/', auth, ProjectController.index)
  .get('/projects', auth, ProjectController.index)
  .get('/project/:_id/scenarios', auth, ProjectController.scenarios);

export default router;