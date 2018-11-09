import Router from 'koa-router';
import {appAuth as auth} from '../middlewares/auth';

import ScenarioController from "../controllers/ScenarioController";

const router = new Router({
  prefix: '/app/scenario'
});

router.get('/:_id/steps', auth, ScenarioController.steps)
  .get('/:_id/runs', auth, ScenarioController.runs)
  .post("/save", auth , ScenarioController.save)
    .get('/:_id/differnces', auth , ScenarioController.differences)
    .get('/:_id/corelations', auth, ScenarioController.correlations)
  .post('/delete', auth, ScenarioController.delete);

export default router;