import { spawn } from 'child_process';
import fs from 'fs';
import Application from '../models/Application';
import ParamSetting from '../models/ParamSetting';
import UniqueParam from '../models/UniqueParam';
import PerformanceController from './PerformanceController';
import RunController from './RunController';
import ApplicationController from './ApplicationController';
import Test from '../models/Test';
import pool from '../middlewares/database';
import config from '../config';
import Workflow from '../models/Workflow';
import User from '../models/User';
import { mergeJmx, jmxPacing } from '../utility/jmxConstants';
import { calculateTotalRecordsNeeded } from '../utility/helper';
const commonColumns = ['isUniqueRepeated', 'isUsed', 'testId'];
//const io = require('../utility/socket').getio();
class LoadRunner {
    constructor() {
        return {
            prepareJmeter: this.prepareJmeter.bind(this),
            runTest: this.runTest.bind(this),
            saveCsv: this.saveCsv.bind(this),
            dryRun: this.dryRun.bind(this)
        }
    }

    async afterDryRun(application) {
        /* 
        do calculation 
            1) get difference between max and min timestamp of each workflow from jtl data as M
            2) calculate pacing for each workflow as : p = 3600 - ( M * x of itteration (H) ) / H - 1
            3) calculate delay as : p - 15% of p 
            4) calculate range as : 15% of p
            5) update each workflow with pace time delay and range
            6) update application dry run status as true
        */
        const testDetails = await Test.findOne({ application: application._id, is_dry_run: true });
        const q = `select threadName, max(timestamp) - min(timestamp) as timeDuration from performance_test_report where test_id = '${testDetails._id}' and threadName is not null group by threadName`;
        const responseTime = await pool.query(q);
        console.log("response", responseTime)
        for (let i = 0; i < responseTime.length; i++) {
            // eg name : W01_Blaze1
            let obj = responseTime[i];
            console.log("obj", obj['threadName'])
            let workflowSequence = obj['threadName'].split('_')[0].substring(1);
            // duration is timeDiffernce of workflow from jtl in secs
            let duration = obj['timeDuration'] / 1000;
            // finding workflow which has same sequence as from jtl
            let found = application.workflow.find(w => w.sequence == workflowSequence);
            if (found['loop_count'] > 1) {
                let pacing = (3600 - (duration * found['loop_count'])) / found['loop_count'] - 1;
                console.log("cheking pacing count", pacing);
                if (pacing < 0) {
                    await Application.update({ _id: application._id }, {
                        pacing: {
                            err: true,
                            message: `Application (${found['name']}) is too slow to complete ${found['loop_count']} itteration in 1 hr. Do you still want to continue ?`
                        }
                    })
                } else {
                    const range = Math.round(0.15 * pacing)
                    const delay = Math.round(pacing - range);
                    await Workflow.update({ _id: found['_id'] }, { jmx_pacing: jmxPacing(delay, range) });
                    console.log("updated pacing", found['_id'])
                }
            }
        }
        await Application.update({ _id: application._id }, { dry_run: true })
        let updatedApp = await Application.findOne({ _id: application._id }).populate('workflow');
        const jmxDetails = await mergeJmx(updatedApp.workflow, 10, false, true);
        await Application.update({ _id: application._id }, { jmx_file: jmxDetails.fileName, status: "Jmx generated" });
        require('../utility/socket').getio().emit("refresh");
    }

    async dryRun(applicationId) {
        try {
            const application = await Application.findOne({ _id: applicationId }).populate('workflow');
            const jmxDetails = await mergeJmx(application.workflow, 1, true);
            let jtlDir = await this.getJtlPath(application.name);
            let jtlPath = jtlDir + "dryrun.jtl";
            const jmeterCommand = await this.prepareJmeterCommand(jmxDetails.filePath, jtlPath);
            this.exectuteJmeter(application, jmeterCommand, 1, [], jtlPath, 0, true, this.afterDryRun.bind(this));
        } catch (e) {
            console.log(e);
            throw (e)
        }

    }

    async exectuteJmeter(application, jmeterCommand, lastUserLoad, previousUserLoads, jtlPath, lastAcceptedUserLoad, dryRun = false, cb = null) {
        const today = new Date();
        const test = await Test.create({
            name: `${application.name}_${lastUserLoad}VU_${today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()}`,
            application: application._id,
            is_dry_run: dryRun
        })
        if (!dryRun) {
            application.workflow.forEach(async w => {
                //if csv not required then dont do anything for that workflow regarding csv
                if (w.csv_required) {
                    const updateSql = `update ${w._id}_csv set testId = '${test['_id']}' where testId = 'tempTestId'`;
                    await pool.query(updateSql);
                }
            })
        }
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
                if (!dryRun) {
                    return await this.prepareJmeter(application, test['_id'], lastUserLoad, previousUserLoads, lastAcceptedUserLoad);
                } else {
                    return cb(application);
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
    async saveCsv(ctx) {
        try {
            console.log("called saved scv");
            const workflowDetails = await Workflow.findOne({ _id: ctx.params.workflow }).populate("app");
            if (!ctx.request.body.files.file) {
                return ctx.body = { success: false, message: "CSV required" }
            }
            let fileData = fs.readFileSync(ctx.request.body.files.file.path, { encoding: 'utf8' });
            let csvName = config.storage.csvPath + workflowDetails.application + ".csv";
            fs.writeFileSync(csvName, fileData)
            let params = await ParamSetting.find({ workflow: ctx.params.workflow });
            // console.log("foundParams", params);
            let uniqueParams = await UniqueParam.find({ workflow: ctx.params.workflow });
            // console.log("found uniques", uniqueParams);
            let headers = params.map(p => p.key);
            // console.log("headers", headers)
            let rawCsvData = this._isCsvValid(fileData, headers, uniqueParams.map(u => u.key), workflowDetails.application.max_user_load)
            // console.log(rawCsvData)
            if (!rawCsvData) {
                return ctx.body = { success: false, message: "CSV is not valid" }
            }
            let totalRecordsNeeded = await calculateTotalRecordsNeeded(workflowDetails);
            console.log("total records needed",totalRecordsNeeded)
            let parsedCsvData = this._removeEmptyValues(rawCsvData, headers, totalRecordsNeeded);
            headers.push(...commonColumns)
            await this.csvToSql(workflowDetails._id, headers, parsedCsvData.data);
            let recordDiff = totalRecordsNeeded - parsedCsvData.recordProvided;
            // console.log("needed", totalRecordsNeeded, "given", parsedCsvData.recordProvided);
            let warning = recordDiff > 0 ? `There are ${recordDiff} less records` : 'None';
            await Workflow.update({ _id: ctx.params.workflow }, { csv_warning: warning, csv_uploaded: true })
            // const totalWorkflowCount = await Workflow.count({ application: workflowDetails.application })
            // const totalUploadedCsv = await Workflow.count({ application: workflowDetails.application, csv_uploaded: true });
            let shouldTestRun = false;
            // if (totalWorkflowCount == totalUploadedCsv) {
            //     shouldTestRun = true;
            // }
            ctx.body = { success: true, message: "CSV saved!", warning, shouldTestRun, appId: workflowDetails.app._id }
        } catch (e) {
            console.log(e)
            ctx.body = { success: false, message: "Something went wrong" }
        }
    }

    async runTest(ctx) {
        const user = await User.findOne({ _id: ctx.user.id })
        try {
            if (user.type === "temp") {
                return ctx.body = { success: false, message: "You dont have permissions" };
            }
            const { application } = ctx.params;
            await ApplicationController.updateStatus(application, "Generating Report");
            const updatedApplication = await Application.findOne({_id: application}).populate("workflow");
            require('../utility/socket').getio().emit("refresh");
            await this.prepareJmeter(updatedApplication)
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
                const jmxDetails = await mergeJmx(application.workflow, currentUserLoad);
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
                    await ApplicationController.updateStatus(application._id, "Report Generated");
                    require('../utility/socket').getio().emit("refresh");
                    return true;
                }
                previousUserLoads.push(currentUserLoad);
                lastUserLoad = currentUserLoad;
                jtlPath = jtlPath + currentUserLoad + '.jtl';
                const jmxDetails = await mergeJmx(application.workflow, currentUserLoad);
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
        const defautCommand = ['-n', '-t', jmxPath, '-l', jtlPath]
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

    async csvToSql(workflowId, columns, csvArr) {
        try {
            const sql = `CREATE TABLE IF NOT EXISTS ${workflowId}_csv ( id int NOT NULL AUTO_INCREMENT PRIMARY KEY, ${columns.map(col => {
                return `${col} varchar(250)  NOT NULL default ''`
            }).join(',')})`;
            await pool.query(sql);
            console.log("table created");
            const sqlTruncate = `TRUNCATE TABLE ${workflowId}_csv`;
            await pool.query(sqlTruncate);
            let sqlInsert = `INSERT INTO ${workflowId}_csv (${columns.join(',')}) VALUES ?`;
            await pool.query(sqlInsert, [csvArr]);
            return;
        } catch (e) {
            console.log(e)
            throw (e)
        }

    }

    _isCsvValid(csvData, headers, uniuqeParams) {
        /**********************************************

            input => takes a raw csv string (string) as csvdata , headers (array), uniqueParams (array)
            conditions =>
                    1) checks with csv headers and with it should have (headers array) (calls _compareArray())
                    2) it should not have first line as empty strings
            output => 1) false if any of above condition fails
                      2) gives an object has stricture as :-
                        {
                            key1: {
                                values: [],
                                unique: boolean
                            },
                            key2: {
                                values: [],
                                unique: boolean
                            }

                        }
                        where key is each header in csv , 
                        values contain all the elements of that header 
                        and uniuqe is true for unique parameters defined by user
        *********************************************************/
        let lines = csvData.split("\n");
        let schema = lines[0].split(",");
        let isValid = this._compareArray(headers, [...schema])
        if (!lines[1] || !lines[1].trim()) {
            isValid = false
        }
        let csvDataObject = {
        };
        // in worst condition no of unique records need :- 783 % of the maxium user load 
        // both headers provided and headers in csv should have same elements no more no less but can have different sequence 
        if (!isValid) {
            return false
        }
        lines.splice(0, 1);
        // minimum lines required 1 and should not be blank
        if (lines[0].split(',').length < 1 || lines[0].split(',').join('') == '') {
            return false
        }
        // if there are no unique params then required conditions checked before
        // if (uniuqeParams.length == 0) {
        //     return true
        // }
        headers.forEach(p => {
            csvDataObject[p] = {
                values: [],
                unique: uniuqeParams.indexOf(p) != -1
            }
        })
        lines.forEach(line => {
            var valArr = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
            if (valArr) {
                headers.forEach(head => {
                    console.log(head)
                    console.log(schema)
                    //console.log(valArr[schema.indexOf(head)])
                    csvDataObject[head]["values"].push(valArr[schema.indexOf(head)]);
                })
            }
        });
        return csvDataObject;
    }

    _removeEmptyValues(csvData, headers, requiredLength) {
        /*
            1) takes csv data(in object form ) unparsed and has empty values and csv headers (array) 
                and total number of records needed for runs
            2) checks and removes empty values from behind the array of the every csvData header key
            3) repeats values to fill empty values (calls _repeatValues())
            4) finally parses data to be compatible with sql insertion and coresponding table 
                return format :=>  {
                    data:[[], [], []],
                    recordProvided: number
                }

        */
        try {
            let originalLength = csvData[headers[0]]["values"].length;
            // task 2
            Object.keys(csvData).forEach(key => {
                let tillWhere = csvData[key]["values"].length;
                for (let i = csvData[key]["values"].length - 1; i >= 0; i--) {
                    if (csvData[key]["values"][i] === '') {
                        tillWhere--;
                    } else {
                        break;
                    }
                    csvData[key]["values"].splice(tillWhere);
                }

                // task 3
                let csvObjectRepectedValues = this._repeatValues(csvData[key]['values'], requiredLength, csvData[key]['unique'])
                csvData[key]["values"] = csvObjectRepectedValues.values;
                csvData[key]["repeatedfrom"] = csvObjectRepectedValues.repeatedfrom
            });
            console.log("inside remove empty", csvData);
            let finalArr = []

            // task 4
            for (let i = 0; i < csvData[headers[0]]["values"].length; i++) {
                let temp = []
                let isUniqueRepeated = "false"
                headers.forEach(h => {
                    temp.push(csvData[h]["values"][i])
                    if (csvData[h]["repeatedfrom"] && csvData[h]["repeatedfrom"] - 1 < i) {
                        // for isUniqueRepeated column
                        isUniqueRepeated = "true"
                    }
                })
                // for isUniqueRepeated column
                temp.push(isUniqueRepeated)
                // for isUsed column
                temp.push("false")
                //for testId column
                temp.push('')
                finalArr.push(temp)
            }
            return {
                data: finalArr,
                recordProvided: originalLength
            };
        } catch (e) {
            throw (e)
        }
    }
    _compareArray(arr1, arr2) {
        if (arr1.length > 0 && arr1.length == arr2.length) {
            let isEqual = true
            arr1.forEach(ele => {
                let index = arr2.indexOf(ele)
                if (index == -1) {
                    isEqual = false
                } else {
                    arr2.splice(index, 1)
                }
            }
            )
            return isEqual
        } else {
            return false
        }
    }

    _repeatValues(array, reLength, isUnique) {
        /*
         input =>   takes in an array , a number (required length), and a boolen(isUnique)
                    and repetes the arrya value to achive the required length and
         output => returns an object contaning new array of desired length and number which tell from
                    where unique got repeated   
        */
        try {
            let length = array.length;
            if (reLength > length) {
                let numberOfElementsToPic = reLength % length;
                let timesToRepeat = (reLength - numberOfElementsToPic) / length;
                let arrayToReturn = [];
                for (let i = 0; i < timesToRepeat; i++) {
                    arrayToReturn.push(...array);
                }
                arrayToReturn.push(...array.splice(0, numberOfElementsToPic))
                return {
                    values: arrayToReturn,
                    repeatedfrom: isUnique ? length : null
                }
            } else {
                return {
                    values: array,
                    repeatedfrom: null
                }
            }
        } catch (e) {
            throw (e)
        }

    }

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
                    "Connect",
                    "id"
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
                await PerformanceController.save(parsed, applicationId, testId)
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