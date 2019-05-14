import edge from'edge.js';
import {logInfo} from "../utility/helper";
import logger from '../utility/logger';
import Session from '../utility/session';
import jwt from '../utility/jwt';
import { responses } from '../utility/helper';

export default async (ctx, next) => {
  try {
    const start = new Date();
    if(ctx.headers.authorization && ctx.headers.authorization !== 'Bearer undefined' && ctx.headers.authorization !== 'Bearer '){
        const payload = await Session.get(ctx.headers.authorization.replace('Bearer ', ''));
        if(payload){
            ctx.user = payload;
            const token = await Session.set(payload);
            ctx.response.set('Authorization', token);
        }
    }
    await next();
    logInfo(start, ctx, logger);
  } catch (err) {
    console.log(err.stack);
    ctx.body = responses[401];
    ctx.status = 401;
    logger.error(err);
  }
}