import kue from 'kue';
import config from '../config'
import UserActivity from "../models/UserActivity";
const queue = kue.createQueue({
  prefix: 'q',
  redis: {
    port: config.redis.port,
    host: config.redis.host,
    auth: config.redis.password,
    db: config.redis.db,
  }});

class TaskQueue{
  constructor (){
    return {
      createJob: this.createJob.bind(this)
    }
  }

  async createJob(jobType,data){
    let job = queue.create(jobType , data).save( async (err)=>{
      if( !err ) await this.executeJob(jobType);
    });
    job.on('complete', function(){
      console.log('Job completed with data');

    }).on('failed', function(errorMessage){
      console.log('Job failed');
    });
  }

  async executeJob(type) {
    queue.process(type, async (job, done) =>{
      await this._saveActivity(job.data, done)
    });
  }

  async _saveActivity(data,done){
      const activity = await UserActivity.create(data);
      if(!activity){
        return done(new Error('Can not save activity'));
      }
      done();
    }
}

export default new TaskQueue();


