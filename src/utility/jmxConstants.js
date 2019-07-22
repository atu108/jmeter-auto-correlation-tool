import Run from '../models/Run';
import Difference from '../models/Difference';
import Application from '../models/Application';
import Workflow from '../models/Workflow';
import Correlation from '../models/Correlation';
import ParamSetting from '../models/ParamSetting';
import pool from '../middlewares/database';
import {URL} from 'url';
import fs from 'fs';
import Request from '../models/Request';
import config from '../config';
const commonColumns = ['isUniqueRepeated', 'isUsed', 'testId'];
const parse = require('tld-extract')

export const resolveArray = async (myArray, request_id) => {
    async function checkCorName(key , value,request){
        const diff = await Difference.find({key,value,"first.request":request});
        if(diff.length !== 1) return false;
         if(diff[0].duplicate){
             const col = await Correlation.find({difference:diff[0].duplicate});
             if(col.length > 0){
                 return "\${"+col[0].reg_name+"}";
             }else{
                 return false;
             }
             
         }else{
             const col = await Correlation.find({difference:diff[0]._id});
             if(col.length > 0){
                 return "\${"+col[0].reg_name+"}";
             }else{
                 return false;
             }
         }
     }

     let toSend = ''
    for(let i = 0; i < myArray.length; i++){
        let temp = await checkCorName(Object.keys(myArray[i])[0],myArray[Object.keys(myArray[i])[0]],request_id);
        console.log("data to fetch", request_id, Object.keys(myArray[i])[0], myArray[i][Object.keys(myArray[i])])
        let inSettings = await ParamSetting.find({
            request: request_id,
            key: Object.keys(myArray[i])[0],
            value: myArray[i][Object.keys(myArray[i])]
        })
        console.log("cehcking settigns data", inSettings);

        // removed _par from parameter name
        if(inSettings.length === 1){
            toSend += `<elementProp name="key" elementType="HTTPArgument">
            <boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.name">${Object.keys(myArray[i])[0]}</stringProp>
            <stringProp name="Argument.value">\${${Object.keys(myArray[i])[0].replace(/&/g, '&amp;')}}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
            <boolProp name="HTTPArgument.use_equals">true</boolProp>
          </elementProp>`
        }else{
            toSend += `<elementProp name="key" elementType="HTTPArgument">
            <boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.name">${Object.keys(myArray[i])[0]}</stringProp>
            <stringProp name="Argument.value">${temp?temp:myArray[i][Object.keys(myArray[i])[0]].replace(/&/g, '&amp;')}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
            <boolProp name="HTTPArgument.use_equals">true</boolProp>
          </elementProp>`
        }
       
    }
    return toSend;
}

export const parseParams = async (request , urlPath) =>{
    // myURL.search.replace(/&/gi,'&amp;')
    // console.log("checking request", request)
   
    const diff = await Difference.find({"first.request":request._id,key:'url'});
    let pathName = urlPath;
    console.log(pathName);
    if(diff.length > 0){
        const col = await Correlation.find({difference:diff[0]._id});
        if(col.length > 0){
            console.log("found col", col);
            const splitWith = parse(diff[0].first.value).tld
            pathName = diff[0].first.value.split(`.${splitWith}`)[1];
            console.log("checking path name", pathName);
            const index = (col[0].key === 'url');
            if(index){
                let regName = col[0].reg_name;
                console.log("inside jmx constants", regName);
                for(let i = 0; i < regName.toReplace.length; i++){
                    pathName = pathName.replace(regName.toReplace[i], `\${${col[0].reg_final_name}_${regName.withWhat[i]}}`);
                }
                pathName = diff[0].first.value.split(`.${splitWith}`)[0] + `.${splitWith}` + pathName;
            }
        }
    }
    //find all the co realtions related to this request then form the same url using _COR
    let myURL = new URL(pathName);
    const params = request.request.params;
    if(params.length === 0){
        return pathName.split(`.${parse(pathName).tld}`)[1].replace(/&/g,'&amp;');
    }
    let inSettings = await ParamSetting.find({
        request: request._id
    });

    for(let i = 0; i < params.length; i++){
        let key = Object.keys(params[i])[0];
        let value = params[i][key];
        let exists = inSettings.findIndex((setting)=> setting.key === key);
        if(exists !== -1){
            myURL.searchParams.set(key, `\${${key}}`);
        }
    }
    return decodeURIComponent(myURL.href.split(`.${parse(myURL.href).tld}`)[1]).replace(/&/g,'&amp;');
}


export const jmxStartXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
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
'<ResultCollector guiclass="StatVisualizer" testclass="ResultCollector" testname="Aggregate Report" enabled="true">\n' +
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
'          <stringProp name="filename"></stringProp>\n' +
'        </ResultCollector>\n' +
'        <hashTree/>\n';

export const jmxEndXml = '</hashTree></hashTree></hashTree></hashTree></hashTree></jmeterTestPlan>';

export let jmxThreadGroupDetails = function(threadGroupDeatils, userLoad){
    return `<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="W${String(threadGroupDeatils.sequence).padStart(2, '0')}_${threadGroupDeatils.name}" enabled="true">\n` +
    '        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>\n' +
    '        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">\n' +
    '          <boolProp name="LoopController.continue_forever">false</boolProp>\n' +
    `         <stringProp name="LoopController.loops">${threadGroupDeatils.loop_count}</stringProp>\n` +
    '        </elementProp>\n' +
    `        <stringProp name="ThreadGroup.num_threads">${userLoad}</stringProp>\n` +
    `      <stringProp name="ThreadGroup.ramp_time">${threadGroupDeatils.rampup_duration}</stringProp>\n` +
    '        <longProp name="ThreadGroup.start_time">1511866023000</longProp>\n' +
    '        <longProp name="ThreadGroup.end_time">1511866023000</longProp>\n' +
    `        <boolProp name="ThreadGroup.scheduler">${threadGroupDeatils.duration ? true: false}</boolProp>\n` +
    `        <stringProp name="ThreadGroup.duration">${threadGroupDeatils.duration}</stringProp>\n` +
    '        <stringProp name="ThreadGroup.delay"></stringProp>\n' +
    '      </ThreadGroup>\n' +
    '      <hashTree>'
}

export const jmxThinkTime = function(delay = 5000, range = 3000){
    return `<hashTree/><GaussianRandomTimer guiclass="GaussianRandomTimerGui" testclass="GaussianRandomTimer" testname="Gaussian Random Timer" enabled="true">
    <stringProp name="ConstantTimer.delay">${delay}</stringProp>
    <stringProp name="RandomTimer.range">${range}</stringProp>
  </GaussianRandomTimer>`
}

export const jmxPacing = function(delay, range){
    return `<kg.apc.jmeter.samplers.DummySampler guiclass="kg.apc.jmeter.samplers.DummySamplerGui" testclass="kg.apc.jmeter.samplers.DummySampler" testname="jp@gc - Dummy Sampler" enabled="true">
    <boolProp name="WAITING">true</boolProp>
    <boolProp name="SUCCESFULL">true</boolProp>
    <stringProp name="RESPONSE_CODE">200</stringProp>
    <stringProp name="RESPONSE_MESSAGE">OK</stringProp>
    <stringProp name="REQUEST_DATA">Dummy Sampler used to simulate requests and responses
without actual network activity. This helps debugging tests.</stringProp>
    <stringProp name="RESPONSE_DATA">Dummy Sampler used to simulate requests and responses
without actual network activity. This helps debugging tests.</stringProp>
    <stringProp name="RESPONSE_TIME"></stringProp>
    <stringProp name="LATENCY">0</stringProp>
    <stringProp name="CONNECT">0</stringProp>
    <stringProp name="URL"></stringProp>
    <stringProp name="RESULT_CLASS">org.apache.jmeter.samplers.SampleResult</stringProp>
  </kg.apc.jmeter.samplers.DummySampler>
  <hashTree>
    <GaussianRandomTimer guiclass="GaussianRandomTimerGui" testclass="GaussianRandomTimer" testname="Gaussian Random Timer" enabled="true">
      <stringProp name="ConstantTimer.delay">${delay}</stringProp>
      <stringProp name="RandomTimer.range">${range}</stringProp>
    </GaussianRandomTimer><hashTree/>
    </hashTree>`
}
export const csvDataSet = function(csvName = 'none'){
    return  '<CacheManager guiclass="CacheManagerGui" testclass="CacheManager" testname="HTTP Cache Manager" enabled="true">\n' +
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
                 <stringProp name="filename">${config.storage.csvPath}${csvName}</stringProp>
                   <boolProp name="ignoreFirstLine">false</boolProp>
                 <boolProp name="quotedData">false</boolProp>
                  <boolProp name="recycle">true</boolProp>
                   <stringProp name="shareMode">shareMode.group</stringProp>
                  <boolProp name="stopThread">false</boolProp>
               <stringProp name="variableNames"></stringProp>
        </CSVDataSet><hashTree/>`
}
async function _generateDynamicCsv(workflowDetails) {
    console.log("called generate dynamic")
    /* 
        creates csv from data storred in sql for every workflow with records equal to user load
        stores as file and named according to the user load 
        updates workflow with the csv file name 
        updates the sql records which are fetched with the test id in which the records are used
    */
   try{
    const app = await Application.findOne({_id: workflowDetails.application})
    const userLoad = Math.round(app.max_user_load * workflowDetails.user_load / 100 * workflowDetails.loop_count / 2);
    const sql = `select * from ${workflowDetails._id}_csv where isUsed = 'false' order by id asc limit ${userLoad}`;
    const recordsRequired = await pool.query(sql);
    let ids = [];
    let headers = Object.keys(recordsRequired[0]);
    let csvDataStr = headers.join(',') + '\n';
    recordsRequired.forEach(record => {
        ids.push(record.id)
        let temp = []
        headers.forEach(h => {
            if (!commonColumns.includes(h)) {
                temp.push(record[h])
            }
        })
        csvDataStr += temp.join(',') + '\n';
    })
    const csvName = `${workflowDetails._id}_${userLoad}`;
    fs.writeFileSync(config.storage.csvPath + csvName, csvDataStr)
    await Workflow.update({_id: workflowDetails._id}, {csv_file_name: csvName});
    const updateSql = `update ${workflowDetails._id}_csv set testId = 'tempTestId' , isUsed = true where id in (${ids.join(',')})`;
    console.log("update quiery insode dynamic", updateSql);
    await pool.query(updateSql);
    return csvName;
   }catch(e){
    throw(e)
   }
}
// param userLoad is calculated whlie runnig jmeter 
export const mergeJmx =  async function(workflows, userLoad, dryRun = false, defaultJmx = false) {
    try{
        let dynamicData = '';
        let filename = [];
        const application = workflows[0].application;
        let hashTree = '</hashTree>';
        let workflowUserLoad = 0
        for(let i = 0; i < workflows.length; i++){
            let w = workflows[i];
            filename.push(w.name.split(" ").join("_"));
          // workflowUserLoad is distributed load on this workflow
          // user_load is the percentage user load for this workflow
          workflowUserLoad = (w.user_load * userLoad) / 100;
          let threadGroupDetails = jmxThreadGroupDetails({
            name: w.name,
            loop_count: w.loop_count || '',
            rampup_duration: w.rampup_duration,
            sequence: w.sequence,
            duration: w.duration || ''
          }, workflowUserLoad);
          if(dryRun){
            threadGroupDetails = jmxThreadGroupDetails({
                name: w.name,
                loop_count: 1,
                rampup_duration: 1,
                sequence: w.sequence,
                duration: ''
              }, userLoad)
          }
          
          if(w.csv_required){
            let csvFileName;
              if(dryRun){
                csvFileName = `${w._id}_dryrun.csv`
              }else if(defaultJmx){
                csvFileName = `default.csv`
              }
              else{
                  csvFileName = await _generateDynamicCsv(w)
              }
            let csvData = csvDataSet(csvFileName)
            dynamicData += csvData;
          }
          if (i + 1 == workflows.length) {
            dynamicData += threadGroupDetails + w.jmx_data + w.jmx_pacing;
          } else {
            dynamicData += threadGroupDetails + w.jmx_data + w.jmx_pacing + hashTree;
          }
        }
        const filePath = `${config.storage.path}${application}_${userLoad}.jmx`;
        fs.writeFileSync(filePath, jmxStartXml + dynamicData + jmxEndXml)
        return {
          jmx: jmxStartXml + dynamicData + jmxEndXml,
          filePath,
          fileName: `${application}_${userLoad}.jmx`
      }
    }catch(e){
        throw(e)
    }
}
 