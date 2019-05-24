import Application from '../models/Application';
import Scenario from '../models/Scenario';
import Workflow from '../models/Workflow';
import WorkflowController from './WorkflowController';
import { deleteAppOrWorkflow } from '../utility/helper';
class ApplicationController {
  constructor() {
    return {
      index: this.index.bind(this),
      scenarios: this.scenarios.bind(this),
      save: this.save.bind(this),
      delete: this.delete.bind(this),
      getOne: this.getOne.bind(this),
      updateStatus: this.updateStatus.bind(this)
    }
  }

  async index(ctx) {
    console.log(ctx.user.id);
    const applications = await Application.find({
      owner: ctx.user.id
    }).populate('workflow').populate('test');
    ctx.body = { success: true, data: applications };
  }

  async getOne(ctx) {
    console.log("called getone", ctx.params);
    const application = await Application.findOne({
      _id: ctx.params.id,
      owner: ctx.user.id
    })

    ctx.body = {
      success: true,
      data: application
    }
  }

  async delete(ctx) {
    try {
      await deleteAppOrWorkflow(ctx.params.id, 'application')
    } catch (e) {
      console.log(e);
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
    return ctx.body = {
      success: true,
      message: "Deleted"
    }
  }

  async save(ctx) {
    let { name, url, description, type, version, is_captcha, is_encrypted, is_auth, auth_type } = ctx.request.body;
    let owner = ctx.user.id;
    if (ctx.params.id) {
      await Application.update({ _id: ctx.params.id, owner }, { name, url, description, type, version, is_captcha, is_encrypted, is_auth, auth_type, owner });
      return ctx.body = {
        success: true,
        message: "Project Updated",
        data: app
      };
    }
    const app = await Application.create({ name, url, description, type, version, is_captcha, is_encrypted, is_auth, auth_type, owner });
    ctx.body = {
      success: true,
      message: "Project Saved",
      data: app
    };
  }
  async updateStatus(applicationId, status) {
    try {
      await Application.update({ _id: applicationId }, { status })
      return true
    } catch (e) {
      console.log(e)
      return false;
    }

  }

  async scenarios(ctx) {
    const application = await Application.findById(ctx.params._id);
    const scenarios = await Scenario.find({ project: ctx.params._id });
    ctx.body = { success: true, data: scenarios };
  }
}

export default new ApplicationController();