import path from 'path';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import { CostExplorer } from 'aws-sdk';
const util = require('util')
import Application from '../models/Application';
import PerformanceController from '../controllers/PerformanceController';
import Test from '../models/Test';
const fs_writeFile = util.promisify(fs.writeFile)

class LoadRunner {
    constructor() {
        return {
            exectuteJmeter: this.exectuteJmeter.bind(this)
        }
    }

async exectuteJmeter(jmxFilePath, applicationId) {
        //give file path
        // count of run 
        // appliction id 
        //execute jmeter with jmx file 
        //when jtl created call jtl dumper
        const test = await Test.create({
            name:"Test_" + applicationId,
            application: applicationId
        })
        const jtlPath = "/Users/atul/webroot/perfeasy/jtl/" + applicationId + ".jtl";
        const child = spawn('jmeter', ['-n', '-t', jmxFilePath, '-l', jtlPath])
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', async (chunk) => {
            console.log("reached chunk")
            if (chunk.indexOf("end of run") >= 0) {
                console.log("condition runing")
                await this.dumper(jtlPath, applicationId , test['_id']);
            }
        });
        child.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
        console.log(child.connected)
        // if(!child.connected){
        // }
    }
   
async dumper(jtlFilePath, applicationId, testId){
    console.log("reached dumper")
    fs.readFile(jtlFilePath, 'utf-8', async function (err, data) {
        console.log("error in reading", err)
        console.log(data)
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
        lines.forEach(function(line) {
          var valArr = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
          var entry = {};
          if(valArr){
            headers.forEach( head => {
              let val = valArr[schema.indexOf(head)] === ''? null : valArr[schema.indexOf(head)]
              entry[head] = val;
            })
            entry.application_id = applicationId;
            entry.test_id = testId
            console.log(entry)
            parsed.push(entry);
          } 
        });
        await PerformanceController.save(parsed)
        console.log("saved performcae data");
      });
    }
}





// chnage sql query
// add schedule 
// add test id
// connect report with app
// provising for calling jmx generator 
// params for jmx generator

export default new LoadRunner();