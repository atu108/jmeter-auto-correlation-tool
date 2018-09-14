import {createClient} from 'redis';
import crypto from 'crypto';
import toPromise from 'es6-promisify';

import config from '../config';

import {errorMessages} from './helper';

import logger from './logger';

class Session{
  constructor(){
    const redisOptions = {
      host: config.redis.host,
      port: config.redis.port,
      db: config.redis.db
    };

    if(config.redis.password !== '') redisOptions.password = config.redis.password;

    const redis = createClient(redisOptions);

    redis.on("error", function (err) {
      logger.error(err);
    });

    this.generateBytes = toPromise(crypto.randomBytes, crypto);

    this.redis = {
      set: toPromise(redis.set, redis),
      get: toPromise(redis.get, redis),
      del: toPromise(redis.del, redis)
    };

    return {
      id: this.id.bind(this),
      get: this.get.bind(this),
      set: this.set.bind(this),
      destroy: this.destroy.bind(this)
    }
  }

  async id(length = 24){
    const bytes = await this.generateBytes(length);
    return bytes.toString('hex');
  }

  async get(key){
    const data = await this.redis.get(`${config.session.key}:${key}`);
    return JSON.parse(data);
  }

  async set(key, data){
    console.log(key);
    await this.redis.set(`${config.session.key}:${key}`, JSON.stringify(data));
  }

  async destroy(key){
    await this.redis.del(`${config.session.key}:${key}`);
  }
}

export default (conf) => {
  const store = new Session();
  let KEY = "SESSIONID";
  const config = {};

  if(conf.key) KEY = conf.key;

  return async (ctx, next) => {
    let id = ctx.cookies.get(KEY, config);

    if(!id){
      const sid = await store.id();
      ctx.session = {};
      ctx.cookies.set(KEY, sid, config);
    }else {
      ctx.session = await store.get(id);

      if (typeof ctx.session !== "object" || ctx.session == null) {
        ctx.session = {};
      }
    }

    const old = JSON.stringify(ctx.session);

    await next();

    if(old === JSON.stringify(ctx.session)) return;

    if(id && !ctx.session){
      await store.destroy(id);
      return;
    }



    const sid = await store.id();
    await store.set(sid, ctx.session);
    ctx.cookies.set(KEY, sid, config);
  }
};
