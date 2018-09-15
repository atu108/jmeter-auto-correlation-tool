import template from '../utility/template';
import {to} from '../utility/helper';

import Project from '../models/Project';
import Scenario from '../models/Scenario';
import Recording from '../models/Recording';
import Step from '../models/Step';
import Run from '../models/Run';
import RunValue from '../models/RunValue';
import Session from '../models/Session';
// import config from "../../../jmx-generator/server/config";
import fs from 'fs';
import Difference from '../models/Difference';

// const _tabs = [{
//   label: "Runs",
//   action: "runs",
//   controller: "scenario"
// }, {
//   label: "Steps",
//   action: "steps",
//   controller: "scenario"
// }, {
//   label: "Differences",
//   action: "differnces",
//   controller: "scenario"
// }, {
//   label: "Corelations",
//   action: "corelations",
//   controller: "scenario"
// }];

class ScenarioController{
  constructor(){
    return {
      find:this.find.bind(this),
      delete: this.delete.bind(this),
      saveHar: this.saveHar.bind(this),
    }
  }


  async find(ctx){
    const sessions = await Session.find({run:ctx.params._id});
    ctx.body = template.render(''); //to find and populate the saved hars
  }
  async delete(ctx){
    await Session.delete({_id:session_id});
    ctx.body = JSON.stringify({
      type: "success",
      message: "Deleted successfully, reloading...",
      reload: true
    });
  }

  async saveHar(ctx) {
    const run_id = ctx.request.body.run_id;
    const lastStepSequence = await Request.find({run_id: run_id}).count();
    const scenario = await Scenario.findById(ctx.params._id);
    let readStream;
    try {
      readStream = JSON.parse(fs.readFileSync(ctx.request.body.files.file.path));
    } catch (e) {
      if (e) {
        return ctx.body = template.render(`${config.app.base}session/${ctx.request.body.fields.run_id}?error=${e}`)
      }
    }
    const session = await Session.create(ctx.request.body.fields);
    let finalData = [];
    readStream.log.entries.forEach((entry, index) => {
      let data = {request: {}, response: {}};
      data.url = entry.request.url.split('?')[0];
      data.request.method = entry.request.method;
      data.request.url = entry.request.url;
      data.request.headers = this._parse(entry.request.headers);
      data.request.cookies = this._parse(entry.request.cookies);
      data.request.params = entry.request.queryString ? this._parse(entry.request.queryString) : [];
      data.request.post_data = entry.request.postData ? this._parse(entry.request.postData.params ? entry.request.postData.params : [], entry.request.postData.mimeType === 'application/x-www-form-urlencoded') : [];
      data.response.status = entry.response.status;
      data.response.headers = this._parse(entry.response.headers);
      data.response.cookies = this._parse(entry.response.cookies);
      data.response.body = entry.response.content.text;
      data.project_id = ctx.request.body.fields.project_id;
      data.scenario_id = ctx.request.body.fields.scenario_id;
      data.run_id = ctx.request.body.fields.run_id;
      data.session_id = session._id;
      data.session_sequence = session.sequence;
      data.step_sequence = lastStepSequence + index + 1;
      finalData.push(data);
    });

    const differences = await Difference.create(finalData);
    if (differences) {
      ctx.body = template.render('app.scenario.steps', {
        steps,
        scenario,
        global: {
          title: scenario.name,
          tabs: _tabs,
          _id: ctx.params._id,
          current: "steps",
          sub: "Steps",
          back: `/app/project/${scenario.project}/scenarios`
        }
      });
    }
  }

    _parse(arr,isEncoded){
      let temp = [];
      arr.forEach((obj)=>{
        let test = {};
        let name = obj['name'].indexOf('.') !== -1 ? obj['name'].split(".").join("U+FF0E") : obj['name'];
        let value = obj['value'];
        if(isEncoded){
          value = decodeURIComponent(value);
          name = decodeURIComponent(name);
          test[name] = value;
          temp.push(test);
        }else{
          test[name] = value;
          temp.push(test);
        }
      });
      return temp;
    }

}

export default new SessionController();
