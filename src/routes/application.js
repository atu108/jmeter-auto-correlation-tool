import Router from 'koa-router';
import auth from '../middlewares/auth';

import ApplicationController from "../controllers/ApplicationController";

const router = new Router({
  prefix: '/app'
});

router.get('/applications', ApplicationController.index)
  .post('/application/save', ApplicationController.save)
  .post('/application/save/:id', ApplicationController.save)
  .get('/application/:id', ApplicationController.getOne)
  .get('/application/delete/:id', ApplicationController.delete )
  
export default router;