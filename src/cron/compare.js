import mongoose from 'mongoose';
import config from '../config';
import logger from '../utility/logger';

import Request from '../models/Request';
import CompareModel from '../models/Compare';
import Difference from '../models/Difference';

const ignoredExt = ['css', 'jpeg', 'jpg', 'png', 'js', 'woff2', 'gif', 'PNG', 'JPG', 'JPEG', 'GIF', 'JS', 'GIF', 'woff', 'svg'];
const ignoredUrls = ['www.google-analytics.com', 'www.facebook.com', 'www.fb.com', 'www.youtube.com', 'maps.google.com'];

class Compare {

  constructor(params) {
    this.params = params;
    this.runs = params.runs;
    this.comparissions = [];
    this.mismatchedUrls = [];
    this.current = 0;

    this.connect();
  }

  connect() {
    mongoose.connect(config.database.uri, {
      useMongoClient: true
    });
    mongoose.connection.on('error', logger.error);
    mongoose.Promise = global.Promise;
  }

  async start() {
    let firstRequests = await Request.find({run: this.params.runs[0]}).sort({sequence: 1});
    let secondRequests = await Request.find({run: this.params.runs[1]}).sort({sequence: 1});
    //filtering urls
    const filteredRequets1 = firstRequests.filter((req) => {
      const url = req.url;
      const extension = url.split(/\#|\?/)[0].split('.').pop().trim();
      return ignoredExt.indexOf(extension) === -1
    });

    let filteredRequets2 = secondRequests.filter((req) => {
      const url = req.url;
      const extension = url.split(/\#|\?/)[0].split('.').pop().trim();
      return ignoredExt.indexOf(extension) === -1
    });
        for(let i = 0; i < filteredRequets1.length; i++) {
            console.log("session seq",filteredRequets1[i].session_sequence)
            const urlIndex = filteredRequets2.findIndex(req => (req.url === filteredRequets1[i].url && req.session_sequence.toString() === filteredRequets1[i].session_sequence.toString()));
            if (urlIndex === -1) {
                this.mismatchedUrls.push({
                    session_sequence: filteredRequets1[i].session_sequence,
                    request: filteredRequets1[i]._id,
                    url: filteredRequets1[i].request.url,
                    runs: this.params.runs,
                });
            } else {
                const diff = this._diff(filteredRequets1[i], filteredRequets2[urlIndex]);
                if (diff) this.comparissions.push(...diff);
                filteredRequets2.splice(urlIndex, 1);
            }

        }
        process.send({
            mismatchUrls:this.mismatchedUrls,
            comparissions:this.comparissions,
            compare:this.params
          });
  }

  _getDiff(r1, r2, type, obj) {
    const temp = [];
    for (let prop in r1) {
      if (r2.hasOwnProperty(prop)) {
        if (r1[prop] !== r2[prop]) {
          obj.key = prop;
          obj.first.value = r1[prop];
          obj.second.value = r2[prop];
          obj.location = type;
          temp.push(obj)
        }
      } else {
        obj.key = prop;
        obj.first.value = r1[prop];
        obj.second.value = "";
        obj.location = type;
        temp.push(obj)
      }
    }
    return temp;
  }
  _diff(r1, r2){
    let temp = []
    const headers = this._parse([r1.request.headers, r2.request.headers]);
    const cookies = this._parse([r1.request.cookies, r2.request.cookies]);
    const postParams = this._parse([r1.request.post_data, r2.request.post_data]);
    const queryParams = this._parse([r1.request.params, r2.request.params]);
    let obj = {
      url:r1.url,
      sequence:r1.sequence,
      location: '',
      key: '',
      first: {
        value: '',
        request: r1._id,
        run: r1.run,
      },
      second: {
        value: '',
        request: r2._id,
        run: r2.run,
      },
      scenario:r1.scenario,
        session_sequence:r1.session_sequence
    }
    if(headers[0] && headers[1]){
      temp.push(...this._getDiff(headers[0],headers[1],"header",obj))
    }
    if(cookies[0] && cookies[1]){
      temp.push(...this._getDiff(cookies[0],cookies[1],"cookie",obj))
    }
    if(postParams[0] && postParams[1]){
      temp.push(...this._getDiff(postParams[0],postParams[1],"post_data",obj))
    }
    if(queryParams[0] && queryParams[1]){
      temp.push(...this._getDiff(queryParams[0],queryParams[1],"params",obj))
    }

    if (r1.request.url !== r2.request.url) {
          temp.push({
            url:r1.url,
            sequence:r1.sequence,
            location: 'url',
            key: 'url',
            first: {
              value: r1.request.url,
              request: r1._id,
              run: r1.run,
            },
            second: {
              value: r2.request.url,
              request: r2._id,
              run: r2.run,
            },
            scenario:r1.scenario,
              session_sequence:r1.session_sequence
          });
        }
    return temp;
  }

  _parse(params){
    const parsed = [];
    params.forEach((param, index) => {
      const temp = {};
      let flag = false;
      if(param && Array.isArray(param) && param.length > 0){
        param.forEach(p => {
          Object.keys(p).forEach(key => {
            flag = true;
            temp[key] = p[key];
          });
        })
      }
      if(flag) parsed.push(temp);
    });
    return parsed;
  }
}

process.on('message', async (params) => {
  const compare = new Compare(params);
  await compare.start();
});
