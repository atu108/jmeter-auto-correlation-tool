import axios from 'axios';
import WorkflowController from '../controllers/WorkflowController';
import Dropdown from '../models/Dropdown';
import Workflow from '../models/Workflow';
import PerfromanceMatrix from '../models/PerfromanceMatrix';
import TrackJob from '../models/TrackJob';
import logger from './logger';
import { formatPerfromanceMatrix } from '../utility/helper';
import ApplicationController from '../controllers/ApplicationController';
import RunController from '../controllers/RunController';
const conncurrency = 1;
const retries = 4;

class Har {
  constructor() {
    return {
      start: this.start.bind(this)
    }
  }


  async start() {
    console.log("cron start called")
    const runningTaskCount = await TrackJob.count({ status: "running" });
    if (runningTaskCount < conncurrency) {
      const tasksToRun = await TrackJob.find({ status: "pending", retries: { $lt: retries } }).sort({ priority: -1 }).limit(conncurrency);
      tasksToRun.forEach(async task => {
        console.log("found one job and executing")
        await TrackJob.update({ _id: task._id }, { status: "running" })
        this._har(task, async function deleteTaskOrRetry(error, taskId) {
          if (!error) {
            console.log("task finised")
            await TrackJob.remove({ _id: taskId });
            if (task.generateJmx) {
              await RunController.compare(task.workflow)
            } else {
              ApplicationController.updateStatus(task.application, "Parametrise pending");
              require('../utility/socket').getio().emit('refresh');
            }
          } else {
            await TrackJob.update({ _id: task._id }, { status: "pending", $inc: { retries: 1 } })
            ApplicationController.updateStatus(task.application, "Failed");
            require('../utility/socket').getio().emit('refresh');
            console.log(error)
          }
        })
      })
    } else {
      logger.info("No pending jobs to execute");
    }
  }

  _har(data, cb) {
    console.log("called _har");
    let { workflow, run, application, _id } = data;
    axios({
      method: 'post',
      url: 'http://0.0.0.0:4040/generatehar',
      data: {
        data: JSON.parse(data.savedSteps),
        url: data.start_url,
        filename: data.filename, //ctx.request.body.files.file.name
        saveDropdown: data.saveDropdown,//true
        savePageTiming: data.savePageTiming
      }
    })
      .then(async res => {
        if (res.data.success) {
          let all_select = res.data.select
          await Dropdown.create(all_select.map(s => {
            s.workflow = workflow
            return s;
          }));
          let perfData = res.data.performance;
          const transctionNames = Object.keys(perfData);
          let formatedData = [];
          transctionNames.forEach(name => {
            formatedData.push({
              transaction_name: name,
              matrix: JSON.stringify(perfData[name]['perf_data']),
              sequence: perfData[name]['sequence'],
              workflow,
              application
            })
          })
          if(formatedData.length > 0){
            await PerfromanceMatrix.create(formatedData);
          }
          await WorkflowController.saveRequests(res.data.hars, run, workflow)
          await Workflow.update({ _id: workflow }, { run1_request: true })
          logger.info("Har generated for application " + application + " workflow " + workflow);
          cb(null, _id);
        } else {
          logger.error(res);
          return cb(res);
        }
      })
      .catch(error => {
        logger.error(error);
        return cb(error);
      });
  }
}

export default new Har();
