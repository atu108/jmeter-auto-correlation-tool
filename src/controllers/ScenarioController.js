import template from '../utility/template';
import {to} from '../utility/helper';

import Project from '../models/Project';
import Scenario from '../models/Scenario';
import Recording from '../models/Recording';
import Step from '../models/Step';
import Run from '../models/Run';
import RunValue from '../models/RunValue';

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
      runs: this.runs.bind(this)
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
    const scenario = await Scenario.findById(ctx.params._id);
    const steps = await Step.find({scenario: ctx.params._id});
    ctx.body = template.render('app.scenario.steps', {steps, scenario, global: {title: scenario.name, tabs: _tabs, _id: ctx.params._id, current: "steps", sub: "Steps", back: `/app/project/${scenario.project}/scenarios`}});
  }

  async runs(ctx){
    const scenario = await Scenario.findById(ctx.params._id);
    const runs = await Run.find({scenario: ctx.params._id}).populate('values');
    ctx.body = template.render('app.scenario.runs', {runs, scenario, global: {title: scenario.name, tabs: _tabs, _id: ctx.params._id, current: "runs", sub: "Runs", back: `/app/project/${scenario.project}/scenarios`}});
  }
}

export default new ScenarioController();