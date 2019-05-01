import Router from 'koa-router';
import auth from '../middlewares/auth';

import WorkflowController from "../controllers/WorkflowController";

const router = new Router({
  prefix: '/app'
});

router.get('/workflows/:application', WorkflowController.get)
  .post('/workflow/save', WorkflowController.save)
  .get('workflow/delete/:id', WorkflowController.delete)
  .get('/runvalues/:workflow', WorkflowController.getRunValues)
  .post('/run2values', WorkflowController.saveRunValues)
  .post('/run2', WorkflowController.saveRun2)
  
export default router;