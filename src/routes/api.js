import Router from 'koa-router';
import {apiAuth as auth} from '../middlewares/auth';

import ApiController from "../controllers/ApiController";

const router = new Router({
  prefix: '/api'
});

router.post('/login', ApiController.login)
  .get('/projects', auth, ApiController.projects)
  .get('/project/:_id/scenarios', ApiController.scenarios)
  .post('/save', ApiController.save)
  .post('/excludeurl', ApiController.excludeUrls);

export default router;