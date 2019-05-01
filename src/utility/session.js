import {sign, verify} from 'jsonwebtoken';
import {readFileSync} from 'fs';

import config from '../config';

const privateKey = readFileSync(config.common.privateKey, 'utf8');
const publicKey = readFileSync(config.common.publicKey, 'utf8');

import {errorMessages} from './helper';

import logger from './logger';

class Session{
  constructor(){
    return {
      get: this.get.bind(this),
      set: this.set.bind(this)
    }
  }

  async get(token){
    try{
      const payload = verify(token, publicKey, {
        algorithms: ['RS256']
      });
      if(payload) return payload;
    } catch (err){
      logger.error(err);
      
      throw({
        message: errorMessages.INVALID_TOKEN, 
        name: 'Authorization Error'
      });
    }
  }

  async set(user){
    try{
      const payload = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        location_id: user.location_id,
        generated_at: Date.now()
      }
      
      return sign(payload, privateKey, {
        algorithm: 'RS256',
        expiresIn: config.common.jwtValidity,
        issuer: config.common.jwtIssuer
      });
    } catch (err){
      logger.error(err);
    }
  }
}

export default new Session();
