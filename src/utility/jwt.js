import jwt from 'jsonwebtoken';
import toPromise from 'es6-promisify';

import config from '../config';

import {errorMessages} from './helper';

import logger from './logger';

class Jwt{
  constructor(){
    
    this.jwt = {
      sign: toPromise(jwt.sign, jwt),
      verify: toPromise(jwt.verify, jwt)
    };

    return {
      get: this.get.bind(this),
      set: this.set.bind(this)
    }
  }

  async get(token){
    try{
      const payload = await this.jwt.verify(token, config.app.secret);
      if(payload) return payload;
    } catch (err){
      logger.error(err);
      throw({message: errorMessages.INVALID_TOKEN, name: 'Authorization Error'});
    }
  }

  async set(user){
    try{
      const payload = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        generated_at: Date.now()
      }
      const tokens = await this.jwt.sign(payload, config.app.secret);
      return tokens;
    } catch (err){
      logger.error(err);
    }
  }
}

export default new Jwt();
