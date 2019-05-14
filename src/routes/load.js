import Router from 'koa-router';
import auth from '../middlewares/auth';

import LoadRunnerController from "../controllers/LoadRunner";

const router = new Router({
  prefix: '/app'
});

router.get('/runTest/:workflow', auth , LoadRunnerController.runTest)
  
  
export default router;