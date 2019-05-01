import 'babel-polyfill';
import path from 'path';
import body from 'koa-body'
import Koa from 'koa';
import mongoose from 'mongoose';
import serve from 'koa-static';
import session from 'koa-generic-session';
import redisStore from 'koa-redis';

import config from './config';
import router from './routes';

import logger from './utility/logger';
import mail from './utility/mail';
import queue from './utility/queue';
import httpError from './utility/error';

import response from './middlewares/response';
mongoose.connect(config.database.uri, {
  useMongoClient: true
});
mongoose.connection.on('error', logger.error);
mongoose.Promise = global.Promise;

const app = new Koa();
const cors = require('@koa/cors');
app.use(cors());

app.keys = [config.app.secret, 'testingtool-app'];

app
  .use(body({
      formidable:{uploadDir: './uploads'},
      multipart:true, limit: '50mb'}))
  .use(serve(path.join(__dirname, 'static'), {
    gzip: true
  }))
  .use(serve(path.join(__dirname, '../uploads'), {
    gzip: true
  }))
  .use(serve(path.join(__dirname, '../jmx'), {
    gzip: true
  }))
  .use(session({
    key: config.session.key,
    path: '/',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    overwrite: true,
    signed: true,
    store: redisStore(config.redis)
  }))
  .use(response)
  .use(router)
    .use(cors()) 
  .use(httpError);

app.on('error', (err) => {
  logger.error(err);
});

// Start the application
app.listen(config.app.port, config.app.host, () => {
  console.log(`🖥  Server started at http://0.0.0.0:${config.app.port}/`);
  logger.info(`Server started at http://0.0.0.0:${config.app.port}/`);
});

queue.init();
mail.init();

export default app;
