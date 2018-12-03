import Router from 'koa-router';
import {appAuth as auth} from '../middlewares/auth';

import RunController from "../controllers/RunController";
import backtrack from '../cron/backtrack';

const router = new Router({
  prefix: '/app/run'
});

router.post('/record', auth, RunController.record)
  .post('/save', auth, RunController.save)
  .post('/compare', auth, RunController.compare)
  .post('/delete', auth, RunController.delete)


export default router;