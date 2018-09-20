import Router from 'koa-router';
import {appAuth as auth} from '../middlewares/auth';

import SessionController from "../controllers/SessionController";

const router = new Router({
    prefix: '/app/session'
});

router.post('/save', auth, SessionController.save);

export default router;