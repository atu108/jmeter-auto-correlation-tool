import Router from 'koa-router';
import auth from '../middlewares/auth';

import ApplicationController from "../controllers/ApplicationController";

const router = new Router({
  prefix: '/app'
});

router.get('/applications', auth, ApplicationController.index)
  .post('/application/save', auth, ApplicationController.save)
  .post('/application/save/:id', auth, ApplicationController.save)
  .get('/application/:id', auth, ApplicationController.getOne)
  .get('/application/delete/:id', auth, ApplicationController.delete )
  
export default router;