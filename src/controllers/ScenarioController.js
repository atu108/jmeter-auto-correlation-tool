import template from '../utility/template';
import {to} from '../utility/helper';

import Project from '../models/Project';
import Scenario from '../models/Scenario';
import Recording from '../models/Recording';
import Step from '../models/Step';
import Run from '../models/Run';
import RunValue from '../models/RunValue';
import Difference from '../models/Difference';
import Correlation from '../models/Correlation';
import Request from '../models/Request';
import ParamSetting from '../models/ParamSetting';
const ignoredExt = ['css', 'jpeg', 'jpg', 'png', 'js', 'woff2', 'gif', 'PNG', 'JPG', 'JPEG', 'GIF', 'JS', 'GIF', 'woff', 'svg'];
const ignoredUrls = ['www.google-analytics.com', 'www.facebook.com', 'www.fb.com', 'www.youtube.com', 'maps.google.com', 'www.google.com',
'www.google.co.in','googleads.g.doubleclick.net', 'accounts.google.com', 'www.googletagmanager.com', 'stats.g.doubleclick.net','apis.google.com'];

import config from '../config';

const _tabs = [{
  label: "Runs",
  action: "runs",
  controller: "scenario"
}, {
  label: "Steps",
  action: "steps",
  controller: "scenario"
}, {
  label: "Differences",
  action: "differnces",
  controller: "scenario"
}, {
  label: "Corelations",
  action: "corelations",
  controller: "scenario"
}];

class ScenarioController{
  constructor(){
    return {
      delete: this.delete.bind(this),
      steps: this.steps.bind(this),
      runs: this.runs.bind(this),
        differences : this.differences.bind(this),
        correlations: this.correlations.bind(this),
        save: this.save.bind(this),
        saveParamSettings: this.saveParamSettings.bind(this)
    }
  }

  async delete(ctx){
    await Recording.deleteMany({scenario: {$in : ctx.request.body}});
    await Step.deleteMany({scenario: {$in: ctx.request.body}});
    await Run.deleteMany({scenario: {$in: ctx.request.body}});
    await RunValue.deleteMany({scenario: {$in: ctx.request.body}});
    await Scenario.deleteMany({_id: {$in: ctx.request.body}});


    ctx.body = JSON.stringify({
      type: "success",
      message: "Deleted successfully, reloading...",
      reload: true
    });
  }

  async steps(ctx){
    try{
      const scenario = await Scenario.findById(ctx.params._id);
      const run = await Run.find({scenario: ctx.params._id});
      let requests = await Request.find({scenario: ctx.params._id, run:run[0]._id, $or:[ {'request.params.1': {$exists: true}}, {"request.post_data.1":{$exists: true}}]});
      requests = requests.filter((req) => {
        const url = req.url;
        const extension = url.split(/\#|\?/)[0].split('.').pop().trim();
        // console.log(extension)
        return ignoredExt.indexOf(extension) === -1;
      });
      requests = requests.filter((req) => {
        const url = req.url;
        const loc = new URL(url)
        const host = loc.host
        return ignoredUrls.indexOf(host) === -1;
      });
      ctx.body = template.render('app.scenario.steps', {requests, scenario, global: {title: scenario.name, tabs: _tabs, _id: ctx.params._id, current: "steps", sub: "Steps", back: `/app/project/${scenario.project}/scenarios`}});
    }catch(e){
      console.log(e);
    }
  }
  async saveParamSettings(ctx){
    try{
        await ParamSetting.insertMany(ctx.request.body.paramValues);
        ctx.body = JSON.stringify({
          type: "success",
          message: "Settings Saved",
          reload: true
        });
    }catch(e){
      console.log(e);
    }
  }

  async save(ctx){
  console.log("here", ctx);
  let {name , project , start_url } = ctx.request.body;
  await Scenario.create({name, project, start_url});
  ctx.body = JSON.stringify({
      type: "success",
      message: "Project saved, reloading...",
      reload: true
    });
  }

  async runs(ctx){
    const scenario = await Scenario.findById(ctx.params._id);
    const runs = await Run.find({scenario: ctx.params._id}).populate('sessions');
    ctx.body = template.render('app.scenario.runs', {runs, scenario, global: {title: scenario.name, tabs: _tabs, _id: ctx.params._id, current: "runs", sub: "Runs", back: `/app/project/${scenario.project}/scenarios`}});
  }

  async differences(ctx){
    console.log("called here", ctx.params);
      const scenario = await Scenario.findById(ctx.params._id);
      const differences = await Difference.find({scenario:ctx.params._id});
      ctx.body = template.render('app.scenario.differences',{differences,scenario,global:{title:scenario.name,tabs:_tabs,_id:ctx.params._id,current:"differnces",sub:"Differences", back: `/app/project/${scenario.project}/scenarios`}})
  }
    async correlations(ctx){
        const scenario = await Scenario.findById(ctx.params._id);
        const correlations = await Correlation.find({scenario:ctx.params._id});
        ctx.body = template.render('app.scenario.correlation',{correlations,scenario,global:{title:scenario.name,tabs:_tabs,_id:ctx.params._id,current:"correlations",sub:"Correlations", back: `/app/project/${scenario.project}/scenarios`}})
    }
}

export default new ScenarioController();