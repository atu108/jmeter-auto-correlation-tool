import config from '../config';
import Run from '../models/Run';
import RunValue from '../models/RunValue';
import Request from '../models/Request';
import Compare from '../models/Compare';
import Cron from '../cron';
import Difference from '../models/Difference';
import MisMatchUrl from '../models/MisMatchUrl';
import Backtrack from '../models/Backtrack';
import ParamSetting from '../models/ParamSetting';
import Correlation from '../models/Correlation';
import Workflow from '../models/Workflow';
import Transaction from '../models/Transaction';
import ExcludeUrl from '../models/ExcludeUrl';
import { URL } from 'url';
import { resolveArray, parseParams, jmxThinkTime, mergeJmx} from '../utility/jmxConstants';
import ApplicationController from './ApplicationController';
import LoadRunner from './LoadRunner';
import Application from '../models/Application';
const ignoredExt = config.app.ignoredExt;
var dateFormat = require('dateformat');
var now = new Date();
var forFileName = dateFormat(now, "dd-mm-yyyy-h:MM:ssTT");
class RunController {
  constructor() {
    return {
      compare: this.compare.bind(this),
      delete: this.delete.bind(this),
      generateJmx: this.generateJmx.bind(this),
      recreate: this.recreate.bind(this),
      callBacktrack: this.callBacktrack.bind(this)
    }
  }

  async compare(workflow) {
    const runs = await Run.find({ workflow });
    const compare = await Compare.create({
      title: "Compare Runs " + runs[0]._id + ',' + runs[1]._id,
      runs: [runs[0]._id, runs[1]._id],
      workflow: runs[0].workflow,
      status: "new"
    });

    const job = new Cron('compare', compare);

    job.done(async (res) => {
      let differences = [];
      if (res.comparissions.length > 0) {
        differences = await Difference.insertMany(res["comparissions"]);
        await this._updateComparision(differences);
      }
      if (res.comparissions.length > 0) {
        await MisMatchUrl.insertMany(res["mismatchedUrls"]);
      }
      await Compare.findByIdAndUpdate(res.compare._id, { status: "done" });
      if (differences.length > 0) {
        await this.backtrack(differences[0].workflow, differences[0].first.run)
      } else {
        await this.generateJmx(runs[0], workflow);
      }
    });
  }

  async callBacktrack(ctx){
    await this.compare(ctx.request.body.workflow)
    ctx.body = {status: true, message: "running"}
  }
  async backtrack(workflow, run1) {
    const job = new Cron('backtrack', workflow);
    job.done(async (res) => {
      if (res.correlations.length > 0) {
        await Correlation.insertMany(res['correlations']);
      }
      await this.generateJmx(run1, workflow);
    })
  }


  async delete(ctx) {
    await Request.deleteMany({ run: { $in: ctx.request.body } });
    await Run.deleteMany({ _id: { $in: ctx.request.body } });
    await RunValue.deleteMany({ run: { $in: ctx.request.body } });

    ctx.body = JSON.stringify({
      type: "success",
      message: "Deleted successfully, reloading...",
      reload: true
    });
  }


  async _updateComparision(object) {
    let objectCopy = [...object];
    let check = [];
    for (let i = 0; i < object.length; i++) {
      for (let j = i; j < objectCopy.length; j++) {
        if (object[i].key === objectCopy[j].key && check.indexOf(j) === -1 && object[i]._id !== objectCopy[j]._id && object[i].first.value === objectCopy[j].first.value && object[i].second.value === objectCopy[j].second.value) {
          if(object[i].first.request.toString() == objectCopy[j].first.request.toString()){
            await Difference.remove({_id:objectCopy[j]._id});
          }else{
            await Difference.findByIdAndUpdate(objectCopy[j]._id, { duplicate: object[i]._id });
          }
          check.push(j);
        }
      }
    }
  }


  async generateJmx(run, workflow) {
    console.log("for rerun using api ", run, "wokrflow", workflow)
    let ignoredUrls = await ExcludeUrl.find({});
    ignoredUrls = ignoredUrls.map(obj => obj.url)
    const paramsSettingData = await ParamSetting.find({
      workflow
    })
    const workflowDetails = await Workflow.find({ _id: workflow });
    // const {user_load, duration} = workflowDetails[0];
    // run will be paseed to this function
    let dynamicData = '';
    const transactions = await Transaction.find({ run }).sort({ "sequence": 1 });
    for (let i = 0; i < transactions.length; i++) {
      let requests = await Request.find({ transaction: transactions[i]._id }).sort({ "sequence": 1 });
      dynamicData += `<TransactionController guiclass="TransactionControllerGui" testclass="TransactionController" testname="W${workflowDetails[0].sequence}_T${String(transactions[i].sequence).padStart(2, '0')}_${transactions[i].title}" enabled="true">
          <boolProp name="TransactionController.includeTimers">false</boolProp>
          <boolProp name="TransactionController.parent">false</boolProp>
        </TransactionController><hashTree>`;
    let whichRequest = 0;
      for (let j = 0; j < requests.length; j++) {
        const filterUrl = requests[j].url;
        const loc = new URL(filterUrl)
        const host = loc.host
        if (ignoredExt.indexOf(filterUrl.split(/\#|\?/)[0].split('.').pop().trim()) !== -1 || ignoredUrls.indexOf(host) !== -1) continue;
        whichRequest++;
        let hasReg = await Correlation.find({ "first.request": requests[j]._id, final_regex: { $ne: 'false' } });
        // console.log("data to read", moreDynamic);
        //let hasDiff = await Difference.find({"first.request":requests[j]._id});
        let myURL = new URL(requests[j].request.url);
        const urlWithCorAndPar = await parseParams(requests[j], requests[j].request.url, transactions[i].title);
        //removing headers which have : in their name
        requests[j].request.headers = requests[j].request.headers.filter(header => Object.keys(header)[0][0] !== ':')
        dynamicData += `<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="W${workflowDetails[0].sequence}_T${String(transactions[i].sequence).padStart(2, '0')}_R${String(whichRequest).padStart(2, '0')}_${myURL.pathname.replace(/&/g,'&amp;')}" enabled="true">
            <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" enabled="true">
            ${requests[j].request.post_data.length === 0 ?
            `<collectionProp name="Arguments.arguments"/>` :
            `<collectionProp name="Arguments.arguments">${await resolveArray(requests[j].request.post_data, requests[j]._id)}
              </collectionProp>`}
            </elementProp>
            <stringProp name="HTTPSampler.domain">${myURL.hostname}</stringProp>
            <stringProp name="HTTPSampler.port">${myURL.port}</stringProp>
            <stringProp name="HTTPSampler.protocol">${myURL.protocol.slice(0, -1)}</stringProp>
            <stringProp name="HTTPSampler.contentEncoding"></stringProp>
            <stringProp name="HTTPSampler.path">${urlWithCorAndPar}</stringProp>
            <stringProp name="HTTPSampler.method">${requests[j].request.method}</stringProp>
            <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
            <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
            <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
            <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
            <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
            <stringProp name="HTTPSampler.implementation">Java</stringProp>
            <stringProp name="HTTPSampler.connect_timeout"></stringProp>
            <stringProp name="HTTPSampler.response_timeout"></stringProp>
          </HTTPSamplerProxy>
          <hashTree>
            <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager" enabled="true">
              <collectionProp name="HeaderManager.headers">
              ${requests[j].request.headers.map((header) => `
                  <elementProp name="${Object.keys(header)[0]}" elementType="Header">
                  <stringProp name="Header.name">${Object.keys(header)[0]}</stringProp>
                  <stringProp name="Header.value">${header[Object.keys(header)[0]].replace(/&/g, '&amp;')}</stringProp>
            </elementProp>`).join('')}
            </collectionProp>
            </HeaderManager>
            ${i != 0 && whichRequest == 1 ? `${jmxThinkTime()}`: ''}
              <hashTree/>
            ${hasReg.map((hasReg) => `<RegexExtractor guiclass="RegexExtractorGui" testclass="RegexExtractor" testname="client_id_REX" enabled="true">
              <stringProp name="RegexExtractor.useHeaders">false</stringProp>
              <stringProp name="RegexExtractor.refname">${hasReg.reg_final_name}_COR</stringProp>
              <stringProp name="RegexExtractor.regex">${this._encodeHtml(hasReg.final_regex)}</stringProp>
              <stringProp name="RegexExtractor.template">${hasReg.reg_count}</stringProp>
              <stringProp name="RegexExtractor.default">${hasReg.key}_Not_Found</stringProp>
              <stringProp name="RegexExtractor.match_number">${hasReg.first.atPos}</stringProp>
            </RegexExtractor>
            <hashTree/>`).join('')}
            </hashTree>`
      }
      dynamicData += '</hashTree>'
    }
    /*
      Commented code for saving data in workflow db itself
    */
    // const fileName = `${workflowDetails[0].name.split(' ').join('_')}_${forFileName}.jmx`;
    // console.log("jmeter", fileName)
    // await Workflow.findByIdAndUpdate(workflow, { jmx_file_name: fileName });
    // let file = fs.createWriteStream(`${config.storage.path}${fileName}`);
    // file.write(startXml + dynamicData);
    // file.close();
    await Workflow.findByIdAndUpdate(workflow, { jmx: true, jmx_data: dynamicData })
    //  setTimeout( async ()=>{
    //   await LoadRunner.prepareJmeter(`${config.storage.path}${fileName}`, workflowDetails[0])
    //  }, 1*60*1000);
    const totalWorkflowCount = await Workflow.count({application: workflowDetails[0].application})
    if(totalWorkflowCount == workflowDetails[0].sequence){
      await LoadRunner.dryRun(workflowDetails[0].application)
    }
    return true;
  }

  async recreate(ctx) {
    await this.generateJmx(ctx.params.run, ctx.params.workflow);
  }
  _encodeHtml(str) {
    const escapeChars = {
      '¢': 'cent',
      '£': 'pound',
      '¥': 'yen',
      '€': 'euro',
      '©': 'copy',
      '®': 'reg',
      '<': 'lt',
      '>': 'gt',
      '"': 'quot',
      '&': 'amp',
      '\'': '#39'
    };

    let regexString = '[';
    for (let key in escapeChars) {
      regexString += key;
    }
    regexString += ']';

    let regex = new RegExp(regexString, 'g');

    return str.replace(regex, function (m) {
      return '&' + escapeChars[m] + ';';
    });
  };

}

export default new RunController();
