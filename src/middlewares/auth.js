import {responses} from "../utility/helper";

export const appAuth = async (ctx, next) => {
  try{

    if(!ctx.session.user && ctx.request.header['request-type'] === 'ajax'){
      ctx.body = responses[401];
    }

    if(!ctx.session.user && ctx.request.header['request-type'] !== 'ajax'){
      ctx.redirect('/app/auth/login');
    }

    await next();
  }catch (err){
    ctx.body = responses[err.status];
  }
}

export const apiAuth = async (ctx, next) => {
  try{
    if(!ctx.auth){
      ctx.body = responses[401];
      return;
    }

    await next();
  }catch (err){
    ctx.body = responses[err.status];
  }
}
