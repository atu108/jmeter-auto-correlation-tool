import fs from 'fs';
import videoshow from 'videoshow';
import template from '../utility/template';
import { request, filesInDir, removeDir } from '../utility/helper';
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
import { resolveArray, parseParams, jmxEndXml, jmxStartXml } from '../utility/jmxConstants';
import ApplicationController from './ApplicationController';
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
      recreate: this.recreate.bind(this)
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
          await Difference.findByIdAndUpdate(objectCopy[j]._id, { duplicate: object[i]._id });
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
    const startXml =`<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="W${workflowDetails[0].sequence}_${workflowDetails[0].name}" enabled="true">\n` +
      '        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>\n' +
      '        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">\n' +
      '          <boolProp name="LoopController.continue_forever">${__P(isLoop),}</boolProp>\n' +
      '          <stringProp name="LoopController.loops">${__P(loop,)}</stringProp>\n' +
      '        </elementProp>\n' +
      '        <stringProp name="ThreadGroup.num_threads">${__P(threads,)}</stringProp>\n' +
      '        <stringProp name="ThreadGroup.ramp_time">${__P(rampup,)}</stringProp>\n' +
      '        <longProp name="ThreadGroup.start_time">1511866023000</longProp>\n' +
      '        <longProp name="ThreadGroup.end_time">1511866023000</longProp>\n' +
      '        <boolProp name="ThreadGroup.scheduler">${__P(isDuration),}</boolProp>\n' +
      '        <stringProp name="ThreadGroup.duration">${__P(duration,)}</stringProp>\n' +
      '        <stringProp name="ThreadGroup.delay"></stringProp>\n' +
      '      </ThreadGroup>\n' +
      '      <hashTree>' +
      '<CacheManager guiclass="CacheManagerGui" testclass="CacheManager" testname="HTTP Cache Manager" enabled="true">\n' +
      '        <boolProp name="clearEachIteration">true</boolProp>\n' +
      '        <boolProp name="useExpires">false</boolProp>\n' +
      '      </CacheManager>\n' +
      '      <hashTree/>\n' +
      '      <CookieManager guiclass="CookiePanel" testclass="CookieManager" testname="HTTP Cookie Manager" enabled="true">\n' +
      '        <collectionProp name="CookieManager.cookies"/>\n' +
      '        <boolProp name="CookieManager.clearEachIteration">true</boolProp>\n' +
      '      </CookieManager>\n' +
      '      <hashTree/>\n' +
      `<CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="parameter" enabled="true">
                <stringProp name="delimiter">,</stringProp>
                 <stringProp name="fileEncoding"></stringProp>
                 <stringProp name="filename">${config.storage.csvPath}${workflowDetails[0]._id}</stringProp>
                   <boolProp name="ignoreFirstLine">false</boolProp>
                 <boolProp name="quotedData">false</boolProp>
                  <boolProp name="recycle">true</boolProp>
                   <stringProp name="shareMode">shareMode.group</stringProp>
                  <boolProp name="stopThread">false</boolProp>
               <stringProp name="variableNames"></stringProp>
        </CSVDataSet> <hashTree/> `;
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
        dynamicData += `<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="W${workflowDetails[0].sequence}_T${String(transactions[i].sequence).padStart(2, '0')}_R${String(whichRequest).padStart(2, '0')}_${myURL.pathname}" enabled="true">
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
            ${i !== 0 && j === 0 ? `<hashTree/>
              <GaussianRandomTimer guiclass="GaussianRandomTimerGui" testclass="GaussianRandomTimer" testname="Gaussian Random Timer" enabled="true">
                <stringProp name="ConstantTimer.delay">5000</stringProp>
                <stringProp name="RandomTimer.range">3000</stringProp>
              </GaussianRandomTimer>`: ''}
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
    console.log("jmx",startXml + dynamicData);
    await Workflow.findByIdAndUpdate(workflow, { jmx: true, jmx_data: startXml + dynamicData })
    ApplicationController.updateStatus(workflowDetails[0].application, "Jmx Generated");
    //  setTimeout( async ()=>{
    //   await LoadRunner.prepareJmeter(`${config.storage.path}${fileName}`, workflowDetails[0])
    //  }, 1*60*1000);
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
