import Router from 'koa-router';

import AuthController from "../controllers/AuthController";

const router = new Router({
  prefix: '/app/auth'
});

router.get('/logout', AuthController.logout)
  .get('/login', AuthController.login)
  .post('/login', AuthController.login)
  .get('/register', AuthController.register)
  .post('/register', AuthController.register);

export default router;