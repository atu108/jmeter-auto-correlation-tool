import Router from 'koa-router';
import auth from '../middlewares/auth';

import LoadRunnerController from "../controllers/LoadRunner";

const router = new Router({
  prefix: '/app'
});

router.get('/runTest/:application', auth, LoadRunnerController.runTest)
      .post('/saveCsv/:workflow', auth, LoadRunnerController.saveCsv)


export default router;