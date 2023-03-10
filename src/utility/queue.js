import kue from 'kue';
import logger from './logger'

import config from '../config';

const options = {
  prefix: 'q',
  redis: {
    port: config.redis.port,
    host: config.redis.host,
    auth: config.redis.password,
    db: 3
  },
  jobEvents: false // for memory optimization
};

const interval = 5000;

class Queue{
  constructor(){
    return {
      init: this.init.bind(this),
      log: this.log.bind(this),
      mail: this.mail.bind(this),
      execute: this.execute.bind(this),
      har: this.har.bind(this)
    }
  }

  init(){
    this.q = kue.createQueue(options);
    this.q.watchStuckJobs(interval);
    this.job = kue.Job;
    this._queue_events();
  }

  log(data, priority = 'normal'){
    return this._push('log', data, priority);
  }

  mail(data, priority = 'normal'){
    return this._push('mail', data, priority);
  }
  
  har(data, priority = 'high'){
    return this._push('har', data, priority);
  }

  execute(type, cb){
    this.q.process(type, 1, (job, callback) => {
      cb(job.data, callback);
    })
  }

  _push(id, data, priority = 'normal'){
    return this.q.create(id, data).priority(priority).removeOnComplete(true).attempts(1).save();
  }

  _queue_events(){
    this.q.on('error', err => logger.error(err));
  }
}

export default new Queue();
