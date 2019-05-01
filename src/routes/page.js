import Router from 'koa-router';

import PageController from "../controllers/PageController";

const router = new Router();

router.get('/', PageController.home);

export default router;