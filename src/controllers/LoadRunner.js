import path from 'path';
import { exec, spawn } from 'child_process';
import fs from 'fs';
const util = require('util')
import Application from '../models/Application';
import PerformanceController from '../controllers/PerformanceController';
import RunController from '../controllers/RunController';
import Test from '../models/Test';
import pool from '../middlewares/database';
import config from '../config';
import Workflow from '../models/Workflow';
import User from '../models/User';
class LoadRunner {
    constructor() {
        return {
            prepareJmeter: this.prepareJmeter.bind(this),
            runTest: this.runTest.bind(this)
        }
    }

    async exectuteJmeter(workflowDetails, jmxFilePath, jmeterCommand, lastUserLoad, previousUserLoads, jtlPath, lastAcceptedUserLoad) {
        const today = new Date();
        const test = await Test.create({
            name: `${workflowDetails.application.name}_${lastUserLoad}VU_${today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()}`,
            application: workflowDetails.application._id
        })
        let jmeterStartCommand = 'jmeter';
        if(config.app.server === 'PRODUCTION'){
            jmeterStartCommand = '../../jmeter/bin/jmeter.sh';
        }
        const child = spawn(jmeterStartCommand, jmeterCommand);
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', async (chunk) => {
            console.log("reading chunk", chunk)
            if (chunk.indexOf("end of run") >= 0) {
                console.log("condition runing")
                await this.dumper(jtlPath, workflowDetails.application._id, test['_id']);
                await this.prepareJmeter(jmxFilePath, workflowDetails, test['_id'], lastUserLoad, previousUserLoads, lastAcceptedUserLoad)
            }
        });
        child.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    }

    //
    async calculateUserLoad(failPercent, lastUserLoad, maxUserLoad, lastAcceptedUserLoad) {
        if (failPercent === 0) {
            return Math.round((lastUserLoad + Math.round((maxUserLoad - lastUserLoad) / 2)) / 10) * 10
        } else if (failPercent <= 25) {
            return Math.round((lastUserLoad + Math.round((maxUserLoad - lastUserLoad) * 0.25)) / 10) * 10
        } else if (failPercent > 25 && failPercent < 40) {
            return Math.round((lastUserLoad + Math.round((maxUserLoad - lastUserLoad) * 0.2)) / 10) * 10
        } else {
            return Math.round((lastUserLoad + lastAcceptedUserLoad) / 2)
        }
    }

    async runTest(ctx) {
        const user = await User.findOne({_id: ctx.user.id})
        try {
            if (user.type === "temp") {
                return ctx.body = { success: false, message: "You dont have permissions" };
            }
            const { workflow } = ctx.params;
            const workflowDetails = await Workflow.findOne({ _id: workflow }).populate('application');
            console.log("cehcnijg workflow",workflowDetails);
            this.prepareJmeter(`${config.storage.path}${workflowDetails.jmx_file_name}`, workflowDetails)
                .then(async (res) => {
                    if(res){
                        await Application.update({_id: workflowDetails.application._id},{status: "Completed Run Test"})
                    }
                    
                })
                .catch(e => {
                    console.log(e);
                })
                ctx.body = {success: true, message: "Tests started"}
        } catch (e) {
            console.log(e);
            ctx.body = { sucess: false, message: "Something went wrong" };
        }
    }

    async prepareJmeter(jmxFilePath, workflowDetails, testId = null, lastUserLoad = 0, previousUserLoads = [], lastAcceptedUserLoad = 0) {
        try {
            let jtlPath = await this.getJtlPath(workflowDetails.application._id);
            const { user_load, duration, rampup_duration, loop_count } = workflowDetails;
            const testCount = await Test.count({ application: workflowDetails.application._id })
            console.log("testCOunt", testCount)
            const maxUserLoad = user_load;
            let currentUserLoad = 0;
            if (testCount === 0) {
                previousUserLoads.push(maxUserLoad * 0.1);
                lastUserLoad = maxUserLoad * 0.1;
                currentUserLoad = maxUserLoad * 0.1;
                jtlPath = jtlPath + currentUserLoad + '.jtl';
                const jmeterCommand = await this.prepareJmeterCommand(currentUserLoad, duration, rampup_duration, loop_count, jmxFilePath, jtlPath);
                console.log("jemtere command prepared", jmeterCommand)
                this.exectuteJmeter(workflowDetails, jmxFilePath, jmeterCommand, lastUserLoad, previousUserLoads, jtlPath, lastAcceptedUserLoad);
                console.log("called for first run with user", currentUserLoad);
            } else {
                console.log("called in else 2nd time");
                const failPercent = await this.getFailurePercent(testId);
                console.log("checking fail percent ", failPercent)
                console.log("max and last", lastUserLoad, maxUserLoad)
                if (failPercent <= 40) {
                    lastAcceptedUserLoad = lastUserLoad;
                }
                currentUserLoad = await this.calculateUserLoad(failPercent, lastUserLoad, maxUserLoad, lastAcceptedUserLoad);
                console.log("current user load", currentUserLoad)
                if (previousUserLoads.indexOf(currentUserLoad) != -1 || currentUserLoad < 5 || currentUserLoad > maxUserLoad) {
                    console.log("runs finised")
                    return true;
                }
                previousUserLoads.push(currentUserLoad);
                lastUserLoad = currentUserLoad;
                jtlPath = jtlPath + currentUserLoad + '.jtl';
                const jmeterCommand = await this.prepareJmeterCommand(currentUserLoad, duration, rampup_duration, loop_count, jmxFilePath, jtlPath);
                console.log("jemtere command prepared ", jmeterCommand)
                this.exectuteJmeter(workflowDetails, jmxFilePath, jmeterCommand, lastUserLoad, previousUserLoads, jtlPath, lastAcceptedUserLoad);
                console.log("exectuded another run with %s users", currentUserLoad)
            }
        } catch (e) {
            throw (e)
        }
    }

    async getFailurePercent(test_id) {
        const q = `select ((count(ptr.success) * 100) / (select count(*) from performance_test_report where test_id = '${test_id}' and responseMessage like '\"Number of samples in transaction%\')) as failPercent from performance_test_report ptr where ptr.success= 'false' and ptr.test_id = '${test_id}' and ptr.responseMessage like '\"Number of samples in transaction%\'`;
        const failPercent = await pool.query(q);
        return failPercent[0].failPercent ? failPercent[0].failPercent : 0;
    }

    async getJtlPath(name) {
        console.log(config.storage.jtlPath + name + '/')
        if (!fs.existsSync(config.storage.jtlPath + name + '/')) {
            fs.mkdirSync(config.storage.jtlPath + name + '/');
        }
        console.log("path", config.storage.jtlPath + name + '/')
        return config.storage.jtlPath + name + '/'
    }

    async prepareJmeterCommand(userLoad, duration, rampup, loop_count, jmxPath, jtlPath) {
        const commandObj = {
            "isDuration": "-JisDuration=",
            "isLoop": "-JisLoop=",
            "duration": "-Jduration=",
            "loop": "-Jloop=",
            "rampup": "-Jrampup=",
            "threads": "-Jthreads="
        }
        let commandArr = ['-n'];
        const defautCommand = ['-t', jmxPath, '-l', jtlPath]
        commandArr.push(commandObj.threads + userLoad)
        commandArr.push(commandObj.rampup + rampup)
        if (!duration) {
            commandArr.push(commandObj.isDuration + "false")
            commandArr.push(commandObj.duration + '')
            commandArr.push(commandObj.isLoop + "false")
            commandArr.push(commandObj.loop + loop_count)
        } else {
            commandArr.push(commandObj.isDuration + "true")
            commandArr.push(commandObj.duration + duration)
            commandArr.push(commandObj.isLoop + "false")
            commandArr.push(commandObj.loop + '-1')
        }
        return [...commandArr, ...defautCommand];
    }

    // agar duration nai aaya hai to isDuration false duration blank hoga isLoop bhi false Loopcout ki valuye hogi
    // agar duration ki value hai isDuration true and duration mai duration ki value Isloop true loopCount blank rahega 

    async dumper(jtlFilePath, applicationId, testId) {
        return new Promise(async (resolve, reject) => {
            fs.readFile(jtlFilePath, 'utf-8', async function (err, data) {
                console.log("error in reading", err)
                var headers = [
                    "timeStamp",
                    "elapsed",
                    "label",
                    "responseCode",
                    "responseMessage",
                    "threadName",
                    "dataType",
                    "success",
                    "failureMessage",
                    "bytes",
                    "sentBytes",
                    "grpThreads",
                    "allThreads",
                    "URL",
                    "Filename",
                    "Latency",
                    "Encoding",
                    "SampleCount",
                    "ErrorCount",
                    "IdleTime",
                    "Hostname",
                    "Connect"
                ]
                var lines = data.split("\n");
                var schema = lines[0];
                lines.splice(0, 1);
                schema = schema.split(",");
                var parsed = [];
                lines.forEach(function (line) {
                    var valArr = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
                    var entry = {};
                    if (valArr) {
                        headers.forEach(head => {
                            let val = valArr[schema.indexOf(head)] === '' ? null : valArr[schema.indexOf(head)]
                            entry[head] = val;
                        })
                        entry.application_id = applicationId;
                        entry.test_id = testId
                        parsed.push(entry);
                    }
                });
                await PerformanceController.save(parsed)
                resolve()
                console.log("saved performcae data");
            });
        })
    }
}





// chnage sql query
// add schedule 
// add test id
// connect report with app
// provising for calling jmx generator 
// params for jmx generator

export default new LoadRunner();