import Router from 'koa-router';
import auth from '../middlewares/auth';

import LoadRunnerController from "../controllers/LoadRunner";

const router = new Router({
  prefix: '/app'
});

router.get('/runJmeter', LoadRunnerController.exectuteJmeter)
  
  
export default router;