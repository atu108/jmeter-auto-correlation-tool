import Router from 'koa-router';
import {apiAuth as auth} from '../middlewares/auth';

import ApiController from "../controllers/ApiController";
import aws from '../utility/aws';

const AWS = new aws();

const router = new Router({
  prefix: '/api'
});

// router.post('/login', ApiController.login)
//   .get('/projects', auth, ApiController.projects)
//   .get('/project/:_id/scenarios', ApiController.scenarios)
//   .post('/save', ApiController.save)
//   .post('/excludeurl', ApiController.excludeUrls)
  // router.post('/contact', ApiController.contactForm)
  router.get('/startAws', AWS.start)
//   .post('/suggestion', ApiController.suggestionForm)
//   // .get('/generatehar', ApiController.generateHar);

export default router;