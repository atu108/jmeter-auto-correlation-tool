import Workflow from '../models/Workflow';
import Scenario from '../models/Scenario';
import fs from 'fs';
import Run from '../models/Run';
import SeleniumStep from '../models/SeleniumStep';
import Dropdown from '../models/Dropdown';
import axios from 'axios';
import config from '../config';
import Transaction from '../models/Transaction';
import Application from '../models/Application';
import Request from '../models/Request';
import SeleniumStepValue from '../models/SeleniumStepValue';
import RunController from '../controllers/RunController';
import Schedual from '../models/Schedual';
import ApplicationController from './ApplicationController';
import ParamSetting from '../models/ParamSetting';
import { all } from 'q';
import { deleteAppOrWorkflow } from '../utility/helper';
import TrackJob from '../models/TrackJob';
import { jmxEndXml, jmxStartXml } from '../utility/jmxConstants';
import Har from '../utility/har';

class WorkflowController {
  constructor() {
    return {
      get: this.get.bind(this),
      save: this.save.bind(this),
      getRunValues: this.getRunValues.bind(this),
      saveRunValues: this.saveRunValues.bind(this),
      saveRun2: this.saveRun2.bind(this),
      delete: this.delete.bind(this),
      saveRequests: this._saveRequests.bind(this),
      downloadJmx: this.downloadJmx.bind(this)
    }
  }

  async get(ctx) {
    // const workflows = await Application.find({owner: ctx.user._id, application: ctx.params.application});
    console.log("called")
    const workflows = await Workflow.find({ application: ctx.params.application });
    ctx.body = { success: true, data: workflows };
  }

  async delete(ctx) {
    if (!ctx.params.id) {
      return ctx.body = {
        success: false,
        message: "Workflow id is missing"
      }
    }
    try {
      await deleteAppOrWorkflow(ctx.params.id, 'workflow')
    } catch (e) {
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
    return ctx.body = {
      success: true,
      message: "Workflow deleted"
    }
  }


  async downloadJmx(ctx) {
    const workflowIds = ctx.request.body.workflows;
    const workflowJmxData = await Workflow.find({ _id: { $in: workflowIds } });
    // console.log(workflowJmxData);
    let dynamicData = '';
    let filename = [];
    let hashTree = '</hashTree>';
    workflowJmxData.forEach((w,index) => {
      filename.push(w.name.split(" ").join("_"))
      if(index + 1 == workflowJmxData.length){
        dynamicData += w.jmx_data;
      }else{
        dynamicData += w.jmx_data + hashTree
      }
    });
    console.log(dynamicData)
    ctx.attachment(`${filename.join("&")}.jmx`);
    ctx.type = 'application/xml';
    ctx.body = jmxStartXml + dynamicData + jmxEndXml;
    //ctx.set(`Content-disposition', 'attachment; filename= ${filename.join("&")}.jmx`);
  }

  async save(ctx) {
    let { name, description, application, user_load, duration, rampup_duration, loop_count } = ctx.request.body.fields;
    let readStream = null;
    try {
      readStream = JSON.parse(fs.readFileSync(ctx.request.body.files.file.path));
    } catch (e) {
      console.log(e);
      if (e) {
        return ctx.body = {
          success: false,
          message: "Invalid Selenium File",
        };
      }
    }
    let allCommands = readStream['tests'][0]['commands'];
    let start_url = readStream['url'] + readStream['tests'][0]['commands'][0]['target'];
    let workflowSequence = await Workflow.count({application});
    const workflow = await Workflow.create({ name, description, loop_count, application, start_url, user_load, duration, rampup_duration, file: ctx.request.body.files.file.name, sequence: workflowSequence + 1 });
    const run = await Run.create({ sequence: 1, workflow: workflow._id });
    ApplicationController.updateStatus(application, "Fetching data");
    allCommands.map((obj, index) => {
      delete obj.id
      obj.workflow = workflow._id
      obj.application = application
      obj.sequence = index
    })
    const savedSteps = await SeleniumStep.create(allCommands);
    await TrackJob.create({
      savedSteps: JSON.stringify(savedSteps),
      start_url,
      filename: ctx.request.body.files.file.name,
      saveDropdown: true,
      workflow: workflow._id,
      application: workflow.application,
      run: run._id
    })
    ctx.body = {
      success: true,
      message: "Selenium Steps Saved",
      data: workflow
    };
  }

  async getRunValues(ctx) {
    let steps = await SeleniumStep.find({
      $or: [
        { command: 'type' },
        { command: 'select' },
        { command: 'addSelection' }
      ],
      workflow: ctx.params.workflow
    }).populate('options').populate('run2value')

    // got requests for parametrisation : where post_data has some value in it
    let postRequests = await Request.find({ workflow: ctx.params.workflow, "request.post_data": { $exists: true, $ne: [] } });
    let getRequests = await Request.find({ workflow: ctx.params.workflow, "request.params": { $exists: true, $ne: [] } });
    return ctx.body = {
      success: true,
      data: steps,
      postRequests: postRequests.map(r => {
        return {
          postData: r.request.post_data,
          id: r._id
        }
      }),
      getRequests: getRequests.map(r => {
        return {
          params: r.request.params,
          id: r._id
        }
      })
    }
  }

  async saveRunValues(ctx) {
    let { workflow, application, time } = ctx.request.body;
    let all_fields = Object.keys(ctx.request.body);
    let dataToSave = [];
    let keys = [];
    let paramsSettingsdata = [];
    try {
      all_fields.forEach(key => {
        if (key != 'workflow' && key != "application" && key != "time") {
          if (key.indexOf("____") === -1) {
            dataToSave.push({
              workflow,
              application,
              selenium_step: key,
              value: ctx.request.body[key]
            })
          } else {
            paramsSettingsdata.push({
              workflow,
              application,
              request: key.split("____")[0],
              key: key.split("____")[1],
              value: key.split("____")[2]
            })
            keys.push(key.split("____")[1] + "_par")
          }
        }
      })
      if (paramsSettingsdata.length > 0) {
        await ParamSetting.create(paramsSettingsdata);
        fs.writeFileSync(config.storage.sampleCsvPath + "sample.csv", keys.join(","), "utf8")
        await Workflow.update({ _id: workflow }, { csv_required: true });

      }
      await SeleniumStepValue.create(dataToSave);
      await Workflow.update({ _id: workflow }, { run2_value: true })
      await Schedual.create({ application, time })
      await this.saveRun2(workflow)
    } catch (e) {
      console.log(e);
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
    ctx.body = {
      success: true,
      message: "Values saved"
    }
  }

  async saveRun2(workflowId) {
    let workflow = await Workflow.findById(workflowId);
    let all_commands = await SeleniumStep.find({ workflow: workflow._id }).sort({ sequence: 1 }).populate('run2value')
    ApplicationController.updateStatus(workflow.application, "Generating jmx")
    const run = await Run.create({ sequence: 2, workflow: workflow._id })
    all_commands = all_commands.map(c => {
      if (c.run2value && c.run2value.value) {
        c.value = c.run2value.value
      }
      delete c.run2value
      return c
    })

    await TrackJob.create({
      savedSteps: JSON.stringify(all_commands),
      start_url: workflow.start_url,
      filename: workflow.file ? workflow.file : "temp",
      saveDropdown: false,
      workflow: workflow._id,
      application: workflow.application,
      run: run._id,
      generateJmx: true
    })
  }

  async _saveRequests(hars, run, workflow) {
    const harKeys = Object.keys(hars)
    let key = null;
    let step_sequence = null;
    let txn = null;
    for (let i = 0; i < harKeys.length; i++) {
      key = harKeys[i];
      step_sequence = await Request.find({ run }).count();
      txn = await Transaction.create({
        title: key,
        run,
        sequence: hars[key]['sequence']
      });
      let finalData = [];
      // console.log("transaction of sequence saved", hars[key]['sequence'], key)
      hars[key]['har_data'].log.entries.forEach((entry, index) => {
        let data = { request: {}, response: {} };
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
        data.run = run;
        data.transaction = txn._id;
        data.workflow = workflow;
        data.txn_sequence = hars[key]['sequence'];
        data.sequence = step_sequence + index + 1;
        finalData.push(data);
        console.log("check request sequence", step_sequence + index + 1)
      });
      await Request.create(finalData);
    }
  }

  _parse(arr, isEncoded) {
    let temp = [];
    arr.forEach((obj) => {
      let test = {};
      let name = obj['name'].indexOf('.') !== -1 ? obj['name'].split(".").join("U+FF0E") : obj['name'];

      let value = obj['value'];
      // key name Cookie in header is being ignored
      if (name != 'Cookie') {
        // console.log("checking names", name);
        if (isEncoded) {
          value = decodeURIComponent(value);
          name = decodeURIComponent(name);
          test[name] = value;
          temp.push(test);
        } else {
          test[name] = value;
          temp.push(test);
        }
      }
    });
    return temp;
  }
}

export default new WorkflowController();