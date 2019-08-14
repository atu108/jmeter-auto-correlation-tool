import crypto from 'crypto';
import fetch from 'isomorphic-fetch';
import rimraf from 'rimraf';
import { readdirSync } from 'fs';
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
import config from '../config';
import Run from '../models/Run';
import SeleniumStep from '../models/SeleniumStep';
import Request from '../models/Request';
import SeleniumStepValue from '../models/SeleniumStepValue';
import Dropdown from '../models/Dropdown';
import Application from '../models/Application';
import Workflow from '../models/Workflow';
import Transaction from '../models/Transaction';



export function id() {
  return Math.random().toString(13).replace('0.', '')
}

export async function deleteAppOrWorkflow(id, level, type = 'temp') {
  //according to type of dleteion eg permanent or change status
  let workflow = null
  if (level === 'application') {
    await Application.remove({ _id: id })
    workflow = await Workflow.find({ application: id })
    workflow = workflow.map(w => w._id)
  } else if (level === 'workflow') {
    workflow = [id]
  }
  for (let i = 0; i < workflow.length; i++) {
    await Run.remove({ workflow: workflow[i] })
    await SeleniumStep.remove({ workflow: workflow[i] })
    await Request.remove({ workflow: workflow[i] })
    await SeleniumStepValue.remove({ workflow: workflow[i] })
    await Dropdown.remove({ workflow: workflow[i] })
    await Workflow.remove({ _id: workflow[i] })
    await Transaction.remove({ workflow: workflow[i] })
  }


}
export const isObject = function (item) {
  return (typeof item === "object" && !Array.isArray(item) && item !== null);
}


export const calculateTotalRecordsNeeded = async function (workflow) {
  let workflowDetails;
  if (!isObject(workflow)) {
    workflowDetails = await Workflow.findOne({ _id: workflow }).populate("app");
  } else {
    workflowDetails = workflow
  }
  const { user_load, loop_count, app } = workflowDetails;
  /* 
   User load%	Comments
       10	    Worst Case scenario
       30
       50
       60
       70
       80
       90
       95
       98
       100
       100	    additional Buffer 
       -------------------------
       total 783 % rounded to 800 %
       loop count is divided by 2 for running the test for 30 mins while the inoput is for 1 hr
   */
  return user_load / 100 * app.max_user_load * loop_count / 2 * 8;
}

export const instructionText = function (recordsNeeded) {
  return `
          Please follow the instruction metioned below to avoid any test failures.

          1: Total number of unique parameters should have ${recordsNeeded} records in csv
          2: First line should not be blank
          3: Please do not alter csv headers
          
          Note:- Giving less records might cause test failures

          Thank you for chosing Perfeasy
          `
}

export const responses = {
  200: {
    type: 'success',
    code: 200,
    status: 'ok',
    message: 'The request has succeeded.'
  },
  204: {
    type: 'success',
    code: 204,
    status: 'No Content',
    message: 'No response body to send.'
  },
  400: {
    type: 'error',
    code: 400,
    status: 'Bad Request',
  },
  401: {
    type: 'error',
    code: 401,
    status: 'Unauthorized',
    message: 'Authentication credentials are missing or invalid.'
  },
  403: {
    type: 'error',
    code: 403,
    status: 'Forbidden',
    message: 'The server understood the request but refuses to authorize it.'
  },
  404: {
    type: 'error',
    code: 404,
    status: 'Not Found',
    message: 'The requested URL or Resource is not found.'
  },
  405: {
    type: 'error',
    code: 405,
    status: 'Method Not Allowed',
    message: 'The requested method is not allowed.'
  },
  406: {
    type: 'error',
    code: 406,
    status: 'Not Acceptable',
    message: 'The request has missing file.'
  },
  415: {
    type: 'error',
    code: 415,
    status: 'Unsupported Media Type',
    message: 'The supported media types are JPG,JPEG,PNG.'
  },
  500: {
    type: 'error',
    code: 500,
    status: 'Internal Server Error',
    message: 'The server encountered an unexpected condition that prevented it from fulfilling the request.'
  }
};

export const errorMessages = {
  MISSING: "One or more required parameters are missing.",
  INVALID_LOGIN: "Invalid login credentials.",
  INVALID_TOKEN: "Invalid or expired authorization token."
};

export function isValidMongoDBObjectId(str) {
  return str.length === 24 && /^[a-f\d]{24}$/i.test(str)
}

const time = function (start) {
  const delta = Date.now() - start;
  return (delta < 10000 ? delta + 'ms' : Math.round(delta / 1000) + 's');
};

export function logInfo(start, ctx, logger) {
  const res = ctx.res;

  const onFinish = done.bind(null, 'finish');
  const onClose = done.bind(null, 'finish');

  res.once('finish', onFinish);
  res.once('close', onClose);

  function done(event) {
    res.removeListener('finish', onFinish);
    res.removeListener('close', onClose);

    const resp = responses[ctx.status];

    if (!resp || (ctx.originalUrl.indexOf("/dist/") !== -1 && ctx.status === 200)) return;

    const upstream = resp.type == "error" ? 'xxx' : event === 'close' ? '-x-' : '-->';
    logger.info(`${upstream} ${ctx.method} ${ctx.originalUrl} ${ctx.status} ${time(start)}`);
  }
}


export const encrypt = (password) => {
  const hash = crypto.createHmac('sha512', config.app.secret);
  hash.update(password);
  return hash.digest('hex');
};

export const to = async (promise) => {
  return promise.then(data => [data, null]).catch(err => [null, err]);
}

export const pad = (input, length, char = 0) => {
  return (Array(length + 1).join(char) + input).slice(-length);
}

export const request = async (url, params) => {
  return fetch(url, params);
}

export const filesInDir = (path) => {
  const files = readdirSync(path);
  const fileList = [];
  files.forEach(file => {
    fileList.push(path + "/" + file);
  });
  console.log(fileList);
  return fileList;
}

export const removeDir = (dir, cb) => {
  return rimraf(dir, cb);
}

export const writeCSV = (header, arr) => {
  const csvWriter = createCsvWriter({
    header: header,
    path: config.storage.csvPath
  })
  csvWriter.writeRecords(arr)
    .then(() => {
      console.log('...Done');
    });
}


/*
  perfromance matrix has various values but needed one should be extracted to make a meaningfull data
  this function takes all of the data and extracts whats necessary from that datra in miliseconds
 */
export const extractDataFromPerformanceTiming = (timing, ...dataNames) => {
  const navigationStart = timing.navigationStart;

  const extractedData = {};
  dataNames.forEach(name => {
    extractedData[name] = timing[name] - navigationStart;
  });

  return extractedData;
};
// Connection Time: ConnectEnd - ConnectStart
// DNS Lookup Time: DomainlookupEnd-DomainLookupStart
// Page Load Time: page_load_time = now - performance.timing.navigationStart;
// SSL Time - Connection End - Secure connectionStart
// TTFB= now-ResponseStart

// {
//   "connectEnd": "1565676184966",
//   "connectStart": "1565676184966",
//   "domComplete": 1565676185301,
//   "domContentLoadedEventEnd": 1565676185298,
//   "domContentLoadedEventStart": 1565676185298,
//   "domInteractive": 1565676185298,
//   "domLoading": 1565676185285,
//   "domainLookupEnd": 1565676184966,
//   "domainLookupStart": 1565676184966,
//   "fetchStart": 1565676184966,
//   "loadEventEnd": 1565676185301,
//   "loadEventStart": 1565676185301,
//   "navigationStart": 1565676184962,
//   "redirectEnd": 0,
//   "redirectStart": 0,
//   "requestStart": 1565676184971,
//   "responseEnd": 1565676185277,
//   "responseStart": 1565676185276,
//   "secureConnectionStart": 0,
//   "toJSON": {},
//   "unloadEventEnd": 1565676185282,
//   "unloadEventStart": 1565676185282
// }

export const extractDataFromPerformanceTimingForUap = (timing) => {
  return {
    connectionTime: timing['connectEnd'] - timing['connectStart'],
    dnsLookUpTime: timing['domainLookupEnd'] - timing['domainLookupStart'],
    pageLoadTime: timing['loadEventEnd'] - timing['navigationStart'],
    sslTime: timing['connectEnd'] - timing['secureConnectionStart'] - timing['navigationStart'] <= 0?0:timing['connectEnd'] - timing['secureConnectionStart'] - timing['navigationStart'],
    ttfb: timing['responseStart'] - timing['navigationStart'],
    redirectTime: timing['redirectEnd'] - timing['redirectStart']
  }
}

export const formatPerfromanceMatrix = (perfData, workflow, application) => {
  try{
    const transctionNames = Object.keys(perfData);
    const formatedData = [];
    transctionNames.forEach(name => {
      formatedData.push({
        transaction_name: name,
        matrix: perfData[name]['perf_data'],
        sequence: perfData[name]['sequence'],
        workflow,
        application
      })
    })
    return formatPerfromanceMatrix;
  }catch(e){
    console.log(e);
    throw(e)
  }
}