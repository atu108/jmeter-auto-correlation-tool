import {responses} from "../utility/helper";
import logger from "../utility/logger";

export default async (ctx, next) => {
  try{
    if(!ctx.user) {
      return ctx.body = responses[401];
    }
    await next();
  }catch (err){
    logger.error(err);
    //ctx.body = responses[err.status];
    ctx.body = err.stack;
    ctx.status = 200;
  }
}
