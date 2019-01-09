import template from '../utility/template';
import {to} from '../utility/helper';

import Project from '../models/Project';
import Scenario from '../models/Scenario';
import Recording from '../models/Recording';
import Step from '../models/Step';
import Run from '../models/Run';
import RunValue from '../models/RunValue';
import Request from '../models/Request';
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

class SessionController{
  constructor(){
    return {
      find:this.find.bind(this),
      delete: this.delete.bind(this),
      save: this.save.bind(this),
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

  async save(ctx) {
    const run_id = ctx.request.body.fields.run;
    const lastStepSequence = await Request.find({run: run_id}).count();
    // const scenario = await Scenario.findById(ctx.params._id);
    let readStream;
    try {
      readStream = JSON.parse(fs.readFileSync(ctx.request.body.files.file.path));
    } catch (e) {
      if (e) {
        return ctx.body = {
          type: "success",
          message: "Invalid Har File",
      };
      }
    }
    const session = await Session.create( ctx.request.body.fields );
    let finalData = [];
    console.log(run_id, readStream.log.entries.length );
    readStream.log.entries.forEach( (entry, index) => {
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
      data.run = ctx.request.body.fields.run;
      data.session = session._id;
      data.scenario = ctx.request.body.fields.scenario;
      data.session_sequence = session.sequence;
      data.sequence = lastStepSequence + index + 1;
      finalData.push(data);
    });
    await Request.create(finalData);
      return ctx.body = {
          type: "success",
          message: "Session saved, reloading...",
          reload: true
      };
  }

    _parse(arr,isEncoded){
      let temp = [];
      arr.forEach((obj)=>{
        let test = {};
        let name = obj['name'].indexOf('.') !== -1 ? obj['name'].split(".").join("U+FF0E") : obj['name'];
       
        let value = obj['value'];
        // key name Cookie in header is being ignored
        if(name != 'Cookie'){
          console.log("checking names", name);
          if(isEncoded){
            value = decodeURIComponent(value);
            name = decodeURIComponent(name);
            test[name] = value;
            temp.push(test);
          }else{
            test[name] = value;
            temp.push(test);
          }
        }
      });
      return temp;
    }

}

export default new SessionController();
