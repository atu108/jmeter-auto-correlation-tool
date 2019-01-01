import fs from 'fs';
import videoshow from 'videoshow';
import template from '../utility/template';
import {request, filesInDir, removeDir} from '../utility/helper';

import config from '../config';

import Run from '../models/Run';
import Step from '../models/Step';
import RunValue from '../models/RunValue';
import Request from '../models/Request';
import Compare from '../models/Compare';
import Cron from '../cron';
import Difference from '../models/Difference';
import MisMatchUrl from '../models/MisMatchUrl';
import Backtrack from '../models/Backtrack';
import Correlation from '../models/Correlation';
import Session from '../models/Session';
import {URL} from 'url';
import { resolveArray } from '../utility/jmxConstants';
const ignoredExt = ['css', 'jpeg', 'jpg', 'png', 'js', 'woff2', 'gif', 'PNG', 'JPG', 'JPEG', 'GIF', 'JS', 'GIF', 'woff', 'svg'];
const ignoredUrls = ['www.google-analytics.com', 'www.facebook.com', 'www.fb.com', 'www.youtube.com', 'maps.google.com', 'www.google.com',
'www.google.co.in','googleads.g.doubleclick.net', 'accounts.google.com', 'www.googletagmanager.com', 'stats.g.doubleclick.net','apis.google.com'];
class RunController{
  constructor(){
    return {
      record: this.record.bind(this),
      save: this.save.bind(this),
      compare: this.compare.bind(this),
      delete: this.delete.bind(this),
      generateJmx : this.generateJmx.bind(this)
    }
  }

  async compare(ctx){

    const exists = await Compare.find({runs: {$in: ctx.request.body.ids}});
    if(exists && exists.length > 0) return ctx.body = JSON.stringify({
      type: "error",
      message: "Already compared."
    });

    const runs  = await Run.find({_id:ctx.request.body.ids[0]});

    const compare = await Compare.create({
      title: "Compare Runs " + ctx.request.body.ids.join(", "),
      runs: ctx.request.body.ids,
        scenario:runs.scenario,
      status: "new"
    });

    const job = new Cron('compare', compare);

    job.done(async (res) => {
      let differences = [];
      if(res.comparissions.length > 0){
        differences = await Difference.insertMany(res["comparissions"]);
        await this._updateComparision(differences);
      }
      if(res.comparissions.length > 0){
        await MisMatchUrl.insertMany(res["mismatchedUrls"]);
      }

      await Compare.findByIdAndUpdate(res.compare._id, {status: "done"});
      if(differences.length > 0){
        await this.backtrack(differences[0].scenario, differences[0].first.run)
      }
      
    });

    ctx.body = JSON.stringify({
      type: "success",
      message: "Comparission added in qeueu to process"
    });
  }

  async backtrack(scenario,run1){
      const job = new Cron('backtrack', scenario);
      job.done( async (res)=>{
      if(res.correlations.length > 0){
          await Correlation.insertMany(res['correlations']);
      }
      await this.generateJmx(run1, scenario);
    })
    ctx.body = JSON.stringify({
      type: "success",
      message: "Congrats JMX has been created, Please download",
      reload: true
    });
  }

  async save(ctx){
    const run = await Run.create({
      scenario: ctx.request.body.scenario,
      title: ctx.request.body.title,
      description: ctx.request.body.description,
      status: "done"
    });
    ctx.body = JSON.stringify({
      type: "success",
      message: "Recording saved, reloading...",
      reload: true
    });
  }

  async delete(ctx){
    await Request.deleteMany({run: {$in : ctx.request.body}});
    await Run.deleteMany({_id: {$in: ctx.request.body}});
    await RunValue.deleteMany({run: {$in: ctx.request.body}});

    ctx.body = JSON.stringify({
      type: "success",
      message: "Deleted successfully, reloading...",
      reload: true
    });
  }

  async record(ctx){
    const run = await Run.update({_id: ctx.request.body.id}, {status: "pending"});
    ctx.body = JSON.stringify({
      type: "success",
      message: "Recording inititated, reloading...",
      reload: true
    });

    // request(config.app.harGenerator, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     chrome: config.app.chrome,
    //     run_id: ctx.request.body.id,
    //     temp: config.storage.temp
    //   })
    // }).then(res => {
    //   if(res.status === 200) this._create_video(ctx.request.body.id);
    // }).catch(err => console.log(err));


  }

  async _create_video(id){
    const images = filesInDir(config.storage.temp + id);
    const videoOptions = {
      fps: 2,
      transition: false,
      videoBitrate: 1024,
      videoCodec: 'libx264',
      size: '1920x?',
      audioBitrate: '128k',
      audioChannels: 2,
      format: 'mp4',
      pixelFormat: 'yuv420p'
    }

    videoshow(images, videoOptions)
      .save(config.storage.path + "videos/" + id + ".mp4")
      .on("end", o => {
        console.log("Video created in:", o);
        removeDir(config.storage.temp + id, () => console.log("Temp files deleted"));
      })
      .on("error", (e, out, err) => console.log(e, err, out));
  }

  async _updateComparision(object){
    let objectCopy = [...object];
    let check = [];
    for(let i = 0; i < object.length ; i++){
      for(let j = i; j < objectCopy.length; j++){
        if(object[i].key === objectCopy[j].key && check.indexOf(j) === -1 && object[i]._id !== objectCopy[j]._id && object[i].first.value === objectCopy[j].first.value && object[i].second.value === objectCopy[j].second.value){
            await Difference.findByIdAndUpdate(objectCopy[j]._id, {duplicate: object[i]._id});
            check.push(j);
        }
      }
    }
  }

  // async generateJmx(ctx){
  //   const startXML = '';
  //   const endXML = '';
  //
  //   const dynamicXML = '';
  //   const sessions = await Session.findAll({scenario:ctx.params.id});
  //   for(let i = 0; i< sessions.length; i++){
  //       const requests = await Request.findAll({});
  //     }
  // }

  async generateJmx(run, scenario){

      // run will be paseed to this function
      const startXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<jmeterTestPlan version="1.2" properties="3.2" jmeter="3.3 r1808647">\n' +
          '  <hashTree>\n' +
          '    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Test Plan" enabled="true">\n' +
          '      <stringProp name="TestPlan.comments"></stringProp>\n' +
          '      <boolProp name="TestPlan.functional_mode">false</boolProp>\n' +
          '      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>\n' +
          '      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">\n' +
          '        <collectionProp name="Arguments.arguments"/>\n' +
          '      </elementProp>\n' +
          '      <stringProp name="TestPlan.user_define_classpath"></stringProp>\n' +
          '    </TestPlan>\n' +
          '    <hashTree>\n' +
          '      <CacheManager guiclass="CacheManagerGui" testclass="CacheManager" testname="HTTP Cache Manager" enabled="true">\n' +
          '        <boolProp name="clearEachIteration">true</boolProp>\n' +
          '        <boolProp name="useExpires">false</boolProp>\n' +
          '      </CacheManager>\n' +
          '      <hashTree/>\n' +
          '      <CookieManager guiclass="CookiePanel" testclass="CookieManager" testname="HTTP Cookie Manager" enabled="true">\n' +
          '        <collectionProp name="CookieManager.cookies"/>\n' +
          '        <boolProp name="CookieManager.clearEachIteration">true</boolProp>\n' +
          '      </CookieManager>\n' +
          '      <hashTree/>\n' +
          // '      <CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="UserCredential" enabled="true">\n' +
          // '        <stringProp name="delimiter">,</stringProp>\n' +
          // '        <stringProp name="fileEncoding"></stringProp>\n' +
          // '        <stringProp name="filename">E:\\Cemex\\Cemex\\TestScripts\\Prod7_8_newWF\\TestData_P8\\TestDataCredential_v1.csv</stringProp>\n' +
          // '        <boolProp name="ignoreFirstLine">false</boolProp>\n' +
          // '        <boolProp name="quotedData">false</boolProp>\n' +
          // '        <boolProp name="recycle">true</boolProp>\n' +
          // '        <stringProp name="shareMode">shareMode.all</stringProp>\n' +
          // '        <boolProp name="stopThread">false</boolProp>\n' +
          // '        <stringProp name="variableNames">Username</stringProp>\n' +
          // '      </CSVDataSet>\n' +
          '      <hashTree/>\n' +
          '      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Thread Group" enabled="true">\n' +
          '        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>\n' +
          '        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">\n' +
          '          <boolProp name="LoopController.continue_forever">false</boolProp>\n' +
          '          <stringProp name="LoopController.loops">1</stringProp>\n' +
          '        </elementProp>\n' +
          '        <stringProp name="ThreadGroup.num_threads">1</stringProp>\n' +
          '        <stringProp name="ThreadGroup.ramp_time">1</stringProp>\n' +
          '        <longProp name="ThreadGroup.start_time">1511866023000</longProp>\n' +
          '        <longProp name="ThreadGroup.end_time">1511866023000</longProp>\n' +
          '        <boolProp name="ThreadGroup.scheduler">false</boolProp>\n' +
          '        <stringProp name="ThreadGroup.duration"></stringProp>\n' +
          '        <stringProp name="ThreadGroup.delay"></stringProp>\n' +
          '      </ThreadGroup>\n' +
          '      <hashTree>';
      const endXml = '</hashTree><ResultCollector guiclass="StatVisualizer" testclass="ResultCollector" testname="Aggregate Report" enabled="true">\n' +
          '          <boolProp name="ResultCollector.error_logging">false</boolProp>\n' +
          '          <objProp>\n' +
          '            <name>saveConfig</name>\n' +
          '            <value class="SampleSaveConfiguration">\n' +
          '              <time>true</time>\n' +
          '              <latency>true</latency>\n' +
          '              <timestamp>true</timestamp>\n' +
          '              <success>true</success>\n' +
          '              <label>true</label>\n' +
          '              <code>true</code>\n' +
          '              <message>true</message>\n' +
          '              <threadName>true</threadName>\n' +
          '              <dataType>true</dataType>\n' +
          '              <encoding>false</encoding>\n' +
          '              <assertions>true</assertions>\n' +
          '              <subresults>true</subresults>\n' +
          '              <responseData>false</responseData>\n' +
          '              <samplerData>false</samplerData>\n' +
          '              <xml>false</xml>\n' +
          '              <fieldNames>true</fieldNames>\n' +
          '              <responseHeaders>false</responseHeaders>\n' +
          '              <requestHeaders>false</requestHeaders>\n' +
          '              <responseDataOnError>false</responseDataOnError>\n' +
          '              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>\n' +
          '              <assertionsResultsToSave>0</assertionsResultsToSave>\n' +
          '              <bytes>true</bytes>\n' +
          '              <sentBytes>true</sentBytes>\n' +
          '              <threadCounts>true</threadCounts>\n' +
          '              <idleTime>true</idleTime>\n' +
          '              <connectTime>true</connectTime>\n' +
          '            </value>\n' +
          '          </objProp>\n' +
          '          <stringProp name="filename">C:/ddffd/shdkjd/sfsfs.jtl</stringProp>\n' +
          '        </ResultCollector>\n' +
          '        <hashTree/>\n' +
          '      </hashTree>\n' +
          '    </hashTree>\n' +
          '    <WorkBench guiclass="WorkBenchGui" testclass="WorkBench" testname="WorkBench" enabled="true">\n' +
          '      <boolProp name="WorkBench.save">true</boolProp>\n' +
          '    </WorkBench>\n' +
          '    <hashTree/>\n' +
          '  </hashTree>\n' +
          '</jmeterTestPlan>';

      let dynamicData ='';
      const sessions = await Session.find({run});

      for(let i = 0; i < sessions.length; i++){
          let requests = await Request.find({session:sessions[i]._id}).sort({sequence: 1});
          dynamicData += `<TransactionController guiclass="TransactionControllerGui" testclass="TransactionController" testname="${sessions[i].title}" enabled="true">
          <boolProp name="TransactionController.includeTimers">false</boolProp>
          <boolProp name="TransactionController.parent">false</boolProp>
        </TransactionController><hashTree>`;
          for(let j = 0; j < requests.length; j++){
            const filterUrl = requests[j].url;
            const loc = new URL(filterUrl)
            const host = loc.host
            if(ignoredExt.indexOf(filterUrl.split(/\#|\?/)[0].split('.').pop().trim()) !== -1 || ignoredUrls.indexOf(host) !== -1) continue;
              let hasReg = await Correlation.find({"first.request":requests[j]._id,final_regex:{$ne:'false'}});
              // console.log("data to read", moreDynamic);
              //let hasDiff = await Difference.find({"first.request":requests[j]._id});
              let myURL = new URL(requests[j].url);
              dynamicData += `<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${myURL.pathname}" enabled="true">
            <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" enabled="true">
            ${requests[j].request.post_data.length === 0?
                  `<collectionProp name="Arguments.arguments"/>`:
                  `<collectionProp name="Arguments.arguments">${await resolveArray(requests[j].request.post_data, requests[j]._id)}
              </collectionProp>`}
            </elementProp>
            <stringProp name="HTTPSampler.domain">${myURL.hostname}</stringProp>
            <stringProp name="HTTPSampler.port">${myURL.port}</stringProp>
            <stringProp name="HTTPSampler.protocol">${myURL.protocol.slice(0,-1)}</stringProp>
            <stringProp name="HTTPSampler.contentEncoding"></stringProp>
            <stringProp name="HTTPSampler.path">${myURL.pathname}</stringProp>
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
              ${requests[j].request.headers.map((header)=>`
                  <elementProp name="${Object.keys(header)[0]}" elementType="Header">
                  <stringProp name="Header.name">${Object.keys(header)[0]}</stringProp>
                  <stringProp name="Header.value">${header[Object.keys(header)[0]]}</stringProp>
            </elementProp>`).join('')}
            </collectionProp>
            </HeaderManager>
            <hashTree/>
            ${hasReg.map((hasReg)=>`<RegexExtractor guiclass="RegexExtractorGui" testclass="RegexExtractor" testname="client_id_REX" enabled="true">
              <stringProp name="RegexExtractor.useHeaders">false</stringProp>
              <stringProp name="RegexExtractor.refname">${hasReg.key + "_COR"}</stringProp>
              <stringProp name="RegexExtractor.regex">${this._encodeHtml(hasReg.final_regex)}</stringProp>
              <stringProp name="RegexExtractor.template">${hasReg.regCount}</stringProp>
              <stringProp name="RegexExtractor.default">${hasReg.key}_Not_Found</stringProp>
              <stringProp name="RegexExtractor.match_number">${hasReg.first.atPos}</stringProp>
            </RegexExtractor>
            <hashTree/>`).join('')}
            </hashTree>`
          }
          dynamicData +='</hashTree>'
      }
      // const  runDetails = await Run.findById(run).populate('scenario');
      // console.log("jmx to read",dynamicData);
  
      let file = fs.createWriteStream(`${config.storage.path}${scenario}.jmx`);
      file.write(startXml+dynamicData+endXml);  
      file.close();
      return true;
  }
    _encodeHtml(str){
        const escapeChars = {
            '¢' : 'cent',
            '£' : 'pound',
            '¥' : 'yen',
            '€': 'euro',
            '©' :'copy',
            '®' : 'reg',
            '<' : 'lt',
            '>' : 'gt',
            '"' : 'quot',
            '&' : 'amp',
            '\'' : '#39'
        };

        let regexString = '[';
        for(let key in escapeChars) {
            regexString += key;
        }
        regexString += ']';

        let regex = new RegExp( regexString, 'g');

        return str.replace(regex, function(m) {
            return '&' + escapeChars[m] + ';';
        });
    };

}

export default new RunController();
