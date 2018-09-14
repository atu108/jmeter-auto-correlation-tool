import app from './app';
import storage from './storage';
import database from './database';
import session from './session';
import redis from './redis';
import log from './log';
import mail from './mail';

const config = {
  app,
  database,
  storage,
  session,
  redis,
  log,
  mail
};

export default config;
