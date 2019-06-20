import { spawn } from 'child_process';
import fs from 'fs';
import Application from '../models/Application';
import PerformanceController from './PerformanceController';
import RunController from './RunController';
import ApplicationController from './ApplicationController';
import Test from '../models/Test';
import pool from '../middlewares/database';
import config from '../config';
import Workflow from '../models/Workflow';
import User from '../models/User';
import { mergeJmx , jmxPacing } from '../utility/jmxConstants';
class LoadRunner {
    constructor() {
        return {
            prepareJmeter: this.prepareJmeter.bind(this),
            runTest: this.runTest.bind(this),
            saveCsv: this.saveCsv.bind(this),
            dryRun: this.dryRun.bind(this)
        }
    }

    async afterDryRun(application){
        /* 
        do calculation 
            1) get difference between max and min timestamp of each workflow from jtl data as M
            2) calculate pacing for each workflow as : p = 3600 - ( M * number of itteration (H) ) / H - 1 
            i) 
            3) calculate delay as : p - 15% of p 
            4) calculate range as : 15% of p
            5) update each workflow with pace time delay and range
            6) update application dry run status as true
        */
        const testDetails = await Test.findOne({application: application._id, is_dry_run: true});
        const q = `select threadName, max(timestamp) - min(timestamp) as timeDuration from performance_test_report where test_id = '${testDetails._id}' and threadName is not null group by threadName`;
        const responseTime = await pool.query(q);
        console.log("response",responseTime)
      for(let i = 0; i < responseTime.length; i++){
            // eg name : W01_Blaze1
            let obj = responseTime[i];
            console.log("obj", obj['threadName'])
            let workflowSequence = obj['threadName'].split('_')[0].substring(1);
            // duration is timeDiffernce of workflow from jtl in secs
            let duration = obj['timeDuration'] / 1000;
            // finding workflow which has same sequence as from jtl
            let found = application.workflow.find( w => w.sequence == workflowSequence);
            if(found['loop_count'] > 1){
                let pacing = (3600 - ( duration * found['loop_count'] ))/ found['loop_count'] - 1;
                if( pacing < 0){
                    await Application.update({_id: application._id}, {pacing: {
                        err: true,
                        message: `Application (${found['name']}) is too slow to complete ${found['loop_count']} itteration in 1 hr. Do you still want to continue ?`
                    }})
                }else{
                    const range = Math.round(0.15 * pacing)
                    const delay = Math.round(pacing - range);
                   await Workflow.update({_id: found['_id'] }, { jmx_pacing: jmxPacing(delay,range) });
                   console.log("updated pacing", found['_id'])
                }
            }
        }
        await Application.update({_id: application._id}, {dry_run: true})
        let updatedApp = await Application.findOne({_id: application._id}).populate('workflow');
        const jmxDetails = mergeJmx(updatedApp.workflow, 10);
        ApplicationController.updateStatus(application._id, "Jmx Generated");
        await Application.update({_id: application._id}, {jmx_file: jmxDetails.fileName})
    }

    async dryRun(applicationId){
        const application = await Application.findOne({_id: applicationId}).populate('workflow');
        const jmxDetails = mergeJmx(application.workflow, 1, true);
        let jtlDir = await this.getJtlPath(application.name);
        let jtlPath = jtlDir + "dryrun.jtl";
        const jmeterCommand = await this.prepareJmeterCommand(jmxDetails.filePath , jtlPath);
        this.exectuteJmeter(application, jmeterCommand, 1, [], jtlPath, 0, true, this.afterDryRun)

    }
    async exectuteJmeter(application, jmeterCommand, lastUserLoad, previousUserLoads, jtlPath, lastAcceptedUserLoad, dryRun = false, cb = null) {
        const today = new Date();
        const test = await Test.create({
            name: `${application.name}_${lastUserLoad}VU_${today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()}`,
            application: application._id,
            is_dry_run: dryRun
        })
        let jmeterStartCommand = 'jmeter';
        if (config.app.server === 'PRODUCTION') {
            jmeterStartCommand = config.app.jmeterPath + '/jmeter';
        }
        const child = spawn(jmeterStartCommand, jmeterCommand);
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', async (chunk) => {
            console.log("reading chunk", chunk)
            if (chunk.indexOf("end of run") >= 0) {
                console.log("condition runing")
                await this.dumper(jtlPath, application._id, test['_id']);
                if(!dryRun){
                    await this.prepareJmeter(application, test['_id'], lastUserLoad, previousUserLoads, lastAcceptedUserLoad)
                }else{
                    cb(application)
                }
            }
        });
        child.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    }

    // todo 
    // round to nearest 5 
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

    async saveCsv(ctx){
        try{
            const workflowDetails = await Workflow.findOne({ _id: ctx.params.workflow });
            if(!ctx.request.body.files.file){
                return ctx.body = {success: false, message: "CSV required"}
            }
                let fileData = fs.readFileSync(ctx.request.body.files.file.path);
                let csvName = config.storage.csvPath + workflowDetails.application + ".csv";
                fs.writeFileSync(csvName , fileData, "utf8" )
                await Workflow.update({_id: ctx.params.workflow},{csv_file_name: csvName})
            ctx.body = {success: true, message: "CSV saved!"}
        }catch(e){
            console.log(e)
            ctx.body = {success: false, message: "Something went wrong"}
        } 
    }

    async runTest(ctx) {
        const user = await User.findOne({ _id: ctx.user.id })
        try {
            if (user.type === "temp") {
                return ctx.body = { success: false, message: "You dont have permissions" };
            }

            const { application } = ctx.params;
            const applicationDetails = await Application.findOne({_id:application}).populate("workflow");
            ApplicationController.updateStatus(application, "Generating Report");
            this.prepareJmeter(applicationDetails)
                .then(async (res) => {
                    if (res) {
                        await Application.update({ _id: workflowDetails.application._id }, { status: "Completed Run Test" })
                    }

                })
                .catch(e => {
                    console.log(e);
                })
            ctx.body = { success: true, message: "Tests started" }
        } catch (e) {
            console.log(e);
            ctx.body = { sucess: false, message: "Something went wrong" };
        }
    }

    async prepareJmeter(application, testId = null, lastUserLoad = 0, previousUserLoads = [], lastAcceptedUserLoad = 0) {
        try {
            const { max_user_load } = application;
            let jtlPath = await this.getJtlPath(application._id);
            // const { user_load, duration, rampup_duration, loop_count } = workflowDetails;
            const testCount = await Test.count({ application: application._id, is_dry_run: false })
            const maxUserLoad = max_user_load;
            let currentUserLoad = 0;
            if (testCount === 0) {
                previousUserLoads.push(maxUserLoad * 0.1);
                lastUserLoad = maxUserLoad * 0.1;
                currentUserLoad = maxUserLoad * 0.1;
                jtlPath = jtlPath + currentUserLoad + '.jtl';
                const jmxDetails = mergeJmx(application.workflow, currentUserLoad);
                const jmeterCommand = await this.prepareJmeterCommand(jmxDetails.filePath, jtlPath);
                console.log("jemtere command prepared", jmeterCommand)
                this.exectuteJmeter(application, jmeterCommand, lastUserLoad, previousUserLoads, jtlPath, lastAcceptedUserLoad);
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
                    ApplicationController.updateStatus(application._id, "Report Generated")
                    return true;
                }
                previousUserLoads.push(currentUserLoad);
                lastUserLoad = currentUserLoad;
                jtlPath = jtlPath + currentUserLoad + '.jtl';
                const jmxDetails = mergeJmx(application.workflow, currentUserLoad);
                const jmeterCommand = await this.prepareJmeterCommand(jmxDetails.filePath, jtlPath);
                console.log("jemtere command prepared ", jmeterCommand)
                this.exectuteJmeter(application, jmeterCommand, lastUserLoad, previousUserLoads, jtlPath, lastAcceptedUserLoad);
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

    async prepareJmeterCommand(jmxPath, jtlPath) {
        // const commandObj = {
        //     "isDuration": "-JisDuration=",
        //     "isLoop": "-JisLoop=",
        //     "duration": "-Jduration=",
        //     "loop": "-Jloop=",
        //     "rampup": "-Jrampup=",
        //     "threads": "-Jthreads="
        // }
        // let commandArr = ['-n'];
        const defautCommand = ['-n' ,'-t', jmxPath, '-l', jtlPath]
        // commandArr.push(commandObj.threads + userLoad)
        // commandArr.push(commandObj.rampup + rampup)
        // if (!duration) {
        //     commandArr.push(commandObj.isDuration + "false")
        //     commandArr.push(commandObj.duration + '')
        //     commandArr.push(commandObj.isLoop + "false")
        //     commandArr.push(commandObj.loop + loop_count)
        // } else {
        //     commandArr.push(commandObj.isDuration + "true")
        //     commandArr.push(commandObj.duration + duration)
        //     commandArr.push(commandObj.isLoop + "false")
        //     commandArr.push(commandObj.loop + '-1')
        // }
        return defautCommand;
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