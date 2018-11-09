import template from '../utility/template';
import {to} from '../utility/helper';

import Project from '../models/Project';
import Scenario from '../models/Scenario';

const _tabs = [{
  label: "Scenarios",
  action: "scenarios",
  controller: "project"
}, {
  label: "Reports",
  action: "reports",
  controller: "project"
}, {
  label: "Settings",
  action: "settings",
  controller: "project"
}];

class ProjectController{
  constructor(){
    return {
      index: this.index.bind(this),
      scenarios: this.scenarios.bind(this),
      save: this.save.bind(this)
    }
  }

  async index(ctx){
    const projects = await Project.find({owner: ctx.session.user._id});
    ctx.body = template.render('app.project.index', {projects, global: {title: "Projects", user:ctx.session.user}});
  }

  async save(ctx){
  let {title,url, description } = ctx.request.body;
  let owner = ctx.session.user._id;
  let status = true;
    await Project.create({title, owner, url, description, status});
    ctx.body = JSON.stringify({
      type: "success",
      message: "Project saved, reloading...",
      reload: true
    });
  }

  async scenarios(ctx){
    const project = await Project.findById(ctx.params._id);
    const scenarios = await Scenario.find({project: ctx.params._id});
    ctx.body = template.render('app.project.scenarios', {scenarios, project, global: {title: project.title, tabs: _tabs, current: "scenarios", _id: ctx.params._id, sub: 'Scenarios', back:'/app/projects'}});
  }
}

export default new ProjectController();