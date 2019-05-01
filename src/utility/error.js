import template from './template';
import logger from './logger';
import {responses} from './helper';

export default async (ctx, next) => {
  try{
    await next();

    switch(ctx.status){
      case 404:
        ctx.body = template.render('page.error', {error: responses[404]})
      break;

      case 500:
        ctx.body = template.render('page.error', {error: responses[500]});
      break;
    }
  } catch(err){
    logger.error(err);
  }
};