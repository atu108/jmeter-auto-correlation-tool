import {encrypt} from '../utility/helper';
import jwt from '../utility/jwt';

import User from '../models/User';
import Project from '../models/Project';
import Scenario from '../models/Scenario';
import Recording from '../models/Recording';
import Step from '../models/Step';
import Run from '../models/Run';
import RunValue from '../models/RunValue';

class ApiController{
  constructor(){
    return {
      login: this.login.bind(this),
      projects: this.projects.bind(this),
      scenarios: this.scenarios.bind(this),
      save: this.save.bind(this)
    }
  }

  async login(ctx){
    const user = await User.findOne({email: ctx.request.body.email, password: encrypt(ctx.request.body.password)});

    if (user) {
      delete user.password;
      const token = await jwt.set(user);
      return ctx.body = JSON.stringify({token, user, type: 'success'});
    }else{
      console.log("no valid")
    }

    return ctx.body = JSON.stringify({
      type: 'error',
      message: 'Invalid Login details'
    });
  }

  async projects(ctx){
    const projects = await Project.find({owner: ctx.auth.user.id, status: true}).exec();
    return ctx.body = JSON.stringify({projects, type:'success'});
  }

  async scenarios(ctx){
    const scenarios = await Scenario.find({project: ctx.params._id});
    return ctx.body = JSON.stringify({scenarios, type: "success"});
  }

  async save(ctx){
    let sid = false;
    const {project_id, scenario_id, recording, name} = ctx.request.body;

    sid = scenario_id;

    if(!scenario_id && project_id && name){
      const scenario = await Scenario.create({
        name: name,
        project: project_id,
        start_url: recording.startUrl
      });
      sid = scenario._id;
    }

    const r = await Recording.create({
      start_url: recording.startUrl,
      sequence_count: recording.sequence,
      ua: recording.browserVersion,
      scenario: sid
    });

    const steps = [];

    recording.steps.forEach(step => {
      const temp = {
        target: step.target,
        command: step.command,
        sequence: step.sequence,
        scenario: sid,
        recording: r._id,
      };

      if(step.value) temp.value = step.value;

      steps.push(temp);
    });

    const savedSteps = await Step.insertMany(steps);
    const run = await Run.create({
      scenario: sid,
      title: "First Run",
      description: "Saved using browser recorder",
      status: "new"
    });

    const values = [];

    savedSteps.forEach(step => {
      if(step.command === "assign"){
        values.push({
          target: step.target,
          value: step.value,
          sequence: step.sequence,
          step: step._id,
          run: run._id
        })
      }
    })

    await RunValue.insertMany(values);

    return ctx.body = {type: 'success', id: sid};
  }
}

export default new ApiController();
