import Router from 'koa-router';
import auth from '../middlewares/auth';

import LoadRunnerController from "../controllers/LoadRunner";

const router = new Router({
  prefix: '/app'
});

router.get('/runTest/:application', auth, LoadRunnerController.runTest)
      .post('/saveCsv/:workflow', LoadRunnerController.saveCsv)


export default router;