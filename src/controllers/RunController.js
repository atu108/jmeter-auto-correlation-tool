import fs from 'fs';
import videoshow from 'videoshow';
import template from '../utility/template';
import {request, filesInDir, removeDir} from '../utility/helper';

import config from '../config';

import Run from '../models/Run';
import Step from '../models/Step';
import RunValue from '../models/RunValue';
import Request from '../models/Request';
import Compare from '../models/Compare';
import Cron from '../cron';
import Difference from '../models/Difference';
import MisMatchUrl from '../models/MisMatchUrl';

class RunController{
  constructor(){
    return {
      record: this.record.bind(this),
      save: this.save.bind(this),
      compare: this.compare.bind(this),
      delete: this.delete.bind(this)
    }
  }

  async compare(ctx){

    const exists = await Compare.find({runs: {$in: ctx.request.body.ids}});
    if(exists && exists.length > 0) return ctx.body = JSON.stringify({
      type: "error",
      message: "Already compared."
    });

    const compare = await Compare.create({
      title: "Compare Runs " + ctx.request.body.ids.join(", "),
      runs: ctx.request.body.ids,
      status: "new"
    });

    const job = new Cron('compare', compare);

    job.done(async (res) => {
      if(res.comparissions.length > 0){
        await Difference.insertMany(res["comparissions"]);
      }
      if(re.comparissions.length > 0){
        await MisMatchUrl.insertMany(res["mismatchedUrls"]);
      }
      await Compare.findByIdAndUpdate(res.compare._id, {status: "done"});

    });

    ctx.body = JSON.stringify({
      type: "success",
      message: "Comparission added in qeueu to process"
    });
  }

  async save(ctx){
    const run = await Run.create({
      scenario: ctx.request.body.scenario,
      title: ctx.request.body.title,
      description: ctx.request.body.description,
      status: "new"
    });

    const steIds = Object.keys(ctx.request.body.values);

    if(steIds && steIds.length > 0){
      const steps = await Step.find({_id:{$in:steIds}});

      const values = [];

      steps.forEach(step => {
        values.push({
          step: step._id,
          target: step.target,
          sequence: step.sequence,
          value: ctx.request.body.values[step._id],
          run: run._id
        });
      });

      await RunValue.insertMany(values);
    }

    ctx.body = JSON.stringify({
      type: "success",
      message: "Recording saved, reloading...",
      reload: true
    });
  }

  async delete(ctx){
    await Request.deleteMany({run: {$in : ctx.request.body}});
    await Run.deleteMany({_id: {$in: ctx.request.body}});
    await RunValue.deleteMany({run: {$in: ctx.request.body}});

    ctx.body = JSON.stringify({
      type: "success",
      message: "Deleted successfully, reloading...",
      reload: true
    });
  }

  async record(ctx){
    const run = await Run.update({_id: ctx.request.body.id}, {status: "pending"});
    ctx.body = JSON.stringify({
      type: "success",
      message: "Recording inititated, reloading...",
      reload: true
    });
    // request(config.app.harGenerator, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     chrome: config.app.chrome,
    //     run_id: ctx.request.body.id,
    //     temp: config.storage.temp
    //   })
    // }).then(res => {
    //   if(res.status === 200) this._create_video(ctx.request.body.id);
    // }).catch(err => console.log(err));
  }

  async _create_video(id){
    const images = filesInDir(config.storage.temp + id);
    const videoOptions = {
      fps: 2,
      transition: false,
      videoBitrate: 1024,
      videoCodec: 'libx264',
      size: '1920x?',
      audioBitrate: '128k',
      audioChannels: 2,
      format: 'mp4',
      pixelFormat: 'yuv420p'
    }

    videoshow(images, videoOptions)
      .save(config.storage.path + "videos/" + id + ".mp4")
      .on("end", o => {
        console.log("Video created in:", o);
        removeDir(config.storage.temp + id, () => console.log("Temp files deleted"));
      })
      .on("error", (e, out, err) => console.log(e, err, out));
  }
}

export default new RunController();
