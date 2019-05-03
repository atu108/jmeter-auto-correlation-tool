import Router from 'koa-router';
import auth from '../middlewares/auth';

import WorkflowController from "../controllers/WorkflowController";
import RunController from '../controllers/RunController';

const router = new Router({
  prefix: '/app'
});

router.get('/workflows/:application', WorkflowController.get)
  .post('/workflow/save', WorkflowController.save)
  .get('workflow/delete/:id', WorkflowController.delete)
  .get('/runvalues/:workflow', WorkflowController.getRunValues)
  .post('/run2values', WorkflowController.saveRunValues)
  .post('/run2', WorkflowController.saveRun2)
  .get("/recreateJmx/:workflow/:run", RunController.recreate)
  
export default router;