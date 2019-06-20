import Run from '../models/Run';
import Difference from '../models/Difference';
import Correlation from '../models/Correlation';
import ParamSetting from '../models/ParamSetting';
import {URL} from 'url';
import fs from 'fs';
import Request from '../models/Request';
import config from '../config';
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
        if(inSettings.length === 1){
            toSend += `<elementProp name="key" elementType="HTTPArgument">
            <boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.name">${Object.keys(myArray[i])[0]}</stringProp>
            <stringProp name="Argument.value">\${${Object.keys(myArray[i])[0]}_par}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
            <boolProp name="HTTPArgument.use_equals">true</boolProp>
          </elementProp>`
        }else{
            toSend += `<elementProp name="key" elementType="HTTPArgument">
            <boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.name">${Object.keys(myArray[i])[0]}</stringProp>
            <stringProp name="Argument.value">${temp?temp:myArray[i][Object.keys(myArray[i])[0]]}</stringProp>
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
            myURL.searchParams.set(key, `\${${key}_par}`);
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
    </GaussianRandomTimer>`
}
// param userLoad is calculated whlie runnig jmeter 
export const mergeJmx =  function(workflows, userLoad, dryRun = false) {
    let dynamicData = '';
    let filename = [];
    const application = workflows[0].application;
    let hashTree = '</hashTree>';
    let workflowUserLoad = 0
    workflows.forEach((w, index) => {
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
      if (index + 1 == workflows.length) {
        dynamicData += threadGroupDetails + w.jmx_data + w.jmx_pacing;
      } else {
        dynamicData += threadGroupDetails + w.jmx_data + w.jmx_pacing + hashTree;
      }
    });
    const filePath = `${config.storage.path}${application}_${userLoad}.jmx`;
    fs.writeFileSync(filePath, jmxStartXml + dynamicData + jmxEndXml)
    return {
      jmx: jmxStartXml + dynamicData + jmxEndXml,
      filePath,
      fileName: `${application}_${userLoad}.jmx`
  }
}
 