import edge from'edge.js';
import {logInfo} from "../utility/helper";
import logger from '../utility/logger';
import jwt from '../utility/jwt';

export default async (ctx, next) => {
  try {

    const start = new Date();

    if(/^\/api\//.test(ctx.request.url)){
      if(ctx.request.headers['authorization'] && ctx.request.headers['authorization'] !== ''){
        const user = await jwt.get(ctx.request.headers['authorization'].replace("Bearer ", ""));
        if(user) ctx.auth = {user};
      }
    }else{
      edge.global('authUser', ctx.session.user);
    }

    await next();

    logInfo(start, ctx, logger);

  } catch (err) {
    logger.error(err);
  }
}
