import Router from 'koa-router';

import AuthController from "../controllers/AuthController";

const router = new Router({
  prefix: '/app/auth'
});

router.get('/logout', AuthController.logout)
  .post('/login', AuthController.login)
  .post('/register', AuthController.register);

export default router;