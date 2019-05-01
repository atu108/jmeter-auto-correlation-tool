import mongoose from 'mongoose';
import config from '../config';
import logger from '../utility/logger';
import ExcludeUrl from '../models/ExcludeUrl'

import Request from '../models/Request';

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
    const ignoredExt = config.app.ignoredExt;
    let ignoredUrls = await ExcludeUrl.find({});
    ignoredUrls = ignoredUrls.map(obj=>obj.url)
    let firstRequests = await Request.find({run: this.params.runs[0]}).sort({sequence: 1});
    let secondRequests = await Request.find({run: this.params.runs[1]}).sort({sequence: 1});
    //filtering urls
    let filteredRequets1 = firstRequests.filter((req) => {
      const url = req.url;
      const extension = url.split(/\#|\?/)[0].split('.').pop().trim();
      // console.log(extension)
      return ignoredExt.indexOf(extension) === -1;
    });
    // console.log(firstRequests.length,filteredRequets1.length)

    let filteredRequets2 = secondRequests.filter((req) => {
      const url = req.url;
      const extension = url.split(/\#|\?/)[0].split('.').pop().trim();
      return ignoredExt.indexOf(extension) === -1;
    });
    // for urls
    filteredRequets1 = filteredRequets1.filter((req) => {
      const url = req.url;
      const loc = new URL(url)
      const host = loc.host
      return ignoredUrls.indexOf(host) === -1;
    });

    // for urls
    filteredRequets2 = filteredRequets2.filter((req) => {
      const url = req.url;
      const loc = new URL(url)
      const host = loc.host
      return ignoredUrls.indexOf( host ) === -1;
    });

    let mismatchUrls2 = [];
    let mismatchUrls1 = [];
    // checking mismatch urls in run 2 requests 
    for(let i = 0; i < filteredRequets2.length; i++){
      const urlIndex = filteredRequets1.findIndex(req => (req.url === filteredRequets2[i].url && req.txn_sequence.toString() === filteredRequets2[i].txn_sequence.toString()));
            if (urlIndex === -1) {
                // check referer in header of this url
                mismatchUrls2.push(filteredRequets2[i])

          } 
      }
        for(let i = 0; i < filteredRequets1.length; i++) {
          // console.log("count", i ,"request2 length" ,filteredRequets2.length );
            const urlIndex = filteredRequets2.findIndex(req => (req.url === filteredRequets1[i].url && req.txn_sequence.toString() === filteredRequets1[i].txn_sequence.toString()));
            if (urlIndex === -1) {
              mismatchUrls1.push(filteredRequets1[i])
            } else {
                const diff = this._diff(filteredRequets1[i], filteredRequets2[urlIndex]);
                if (diff) this.comparissions.push(...diff);
                filteredRequets2.splice(urlIndex, 1);
            }

        }
        //console.log(mismatchUrls1.map(obj=>obj.url) , mismatchUrls2.map(obj=>obj.url))
        const mismatchData = this._handleMisMatch(mismatchUrls1, mismatchUrls2);
        for(let i = 0; i < mismatchData.one.length; i++){
          //console.log("inside loop")
          const diff = this._diff(mismatchData.one[i], mismatchData.two[i]);
                if (diff) this.comparissions.push(...diff);
                // console.log("found diff", diff[0].key)
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
          let t = Object.assign({},obj);
          temp.push(t)
        }
      } else {
        obj.key = prop;
        obj.first.value = r1[prop];
        obj.second.value = "";
        obj.location = type;
        let t = Object.assign({},obj);
        temp.push(t)
      }
    }
    return temp;
  }
  _diff(r1, r2){
    let temp = []
    // const headers = this._parse([r1.request.headers, r2.request.headers]);
    // const cookies = this._parse([r1.request.cookies, r2.request.cookies]);
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
      workflow:r1.workflow,
        txn_sequence:r1.txn_sequence,
        transaction:r1.transaction
    }
    // if(headers[0] && headers[1]){
    //   temp.push(...this._getDiff(headers[0],headers[1],"header",obj))
    // }
    // if(cookies[0] && cookies[1]){
    //   temp.push(...this._getDiff(cookies[0],cookies[1],"cookie",obj))
    // }
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
            workflow:r1.workflow,
            txn_sequence:r1.txn_sequence,
            txn_sequence:r1.txn_sequence
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
  _handleMisMatch(mismatchUrls1, mismatchUrls2){
    console.log("Lengths", mismatchUrls1.length, mismatchUrls2.length)
    let toBeCompared1 = []
    let toBeCompared2 = []
    let comparedParents = [];
    for(let i = 0; i< mismatchUrls1.length; i++){
      const index = mismatchUrls2.findIndex(req => (req.txn_sequence.toString() === mismatchUrls1[i].txn_sequence.toString()));
      if(index !== -1){
        //console.log("urls to be found",mismatchUrls1[i].request.url, mismatchUrls2[index].request.url)
        const referersMatched = this._findReferersCon1(mismatchUrls1[i], mismatchUrls2[index]);
        if(referersMatched){
        comparedParents.push({first:mismatchUrls1[i].url, second:mismatchUrls2[index].url})
        toBeCompared1.push(mismatchUrls1[i]);
        toBeCompared2.push(mismatchUrls2[index]);
       }else{
         //console.log("sending urls to match ")
          for(let k = 0; k < comparedParents.length; k++){
            const referersMatched2 = this.__findReferersCon2(comparedParents,mismatchUrls1[i], mismatchUrls2[index])
            if(referersMatched2){
              //console.log("which ones", mismatchUrls1[i].request.url, mismatchUrls1[index].request.url);
              comparedParents.push({first: mismatchUrls1[i].url, second: mismatchUrls2[index].url})
              toBeCompared1.push(mismatchUrls1[i]);
              toBeCompared2.push(mismatchUrls2[index]);
              break;
            }
          }
       }
       const matchedInThird = this._findReferersCon3(mismatchUrls1[i], mismatchUrls2[index]);
       console.log("matched third", matchedInThird);
       if(matchedInThird){
        comparedParents.push({first:mismatchUrls1[i].url, second:mismatchUrls2[index].url})
        toBeCompared1.push(mismatchUrls1[i]);
        toBeCompared2.push(mismatchUrls2[index]);
       }

      }
    }
    return {one:toBeCompared1, two:toBeCompared2};
  }
  _findReferersCon1( mismatchUrls1, mismatchUrls2 ){
    const one = mismatchUrls1.request.headers.filter( obj => (Object.keys(obj)[0] === 'Referer' || Object.keys(obj)[0] === 'referer'));
    const two = mismatchUrls2.request.headers.filter( obj => (Object.keys(obj)[0] === 'Referer' || Object.keys(obj)[0] === 'referer'));
    // console.log("inside condition one", one, two);
    if(one.length > 0 && two.length > 0){
      return one[0]['Referer'] === two[0]['Referer'] || one[0]['referer'] === two[0]['referer']
    }else{
      return false;
    }
  }
__findReferersCon2(parentObjs, mismatchUrls1, mismatchUrls2 ){
  console.log("checking condition2")
  const one = mismatchUrls1.request.headers.filter( obj => (Object.keys(obj)[0] === 'Referer' || Object.keys(obj)[0] === 'referer'));
  const two = mismatchUrls2.request.headers.filter( obj => (Object.keys(obj)[0] === 'Referer' || Object.keys(obj)[0] === 'referer'));
 
  //console.log("refererrs in two", one[0]['Referer'], two[0]['Referer'])
  //console.log("inside condition two", one, two)
  if(one.length > 0 && two.length > 0){
    const parentIndex = parentObjs.findIndex( parentObj => ( (parentObj.first === one[0]['Referer'] &&  parentObj.second === two[0]['Referer']) || (parentObj.first === one[0]['referer'] &&  parentObj.second === two[0]['referer']) ) )
    console.log(parentIndex !== -1);
    return parentIndex !== -1;
  }else{
    return false;
  }   
}

_findReferersCon3(mismatchUrls1, mismatchUrls2){
  const one = mismatchUrls1.request.headers.filter( obj => (Object.keys(obj)[0] === 'Referer' || Object.keys(obj)[0] === 'referer'));
  const two = mismatchUrls2.request.headers.filter( obj => (Object.keys(obj)[0] === 'Referer' || Object.keys(obj)[0] === 'referer'));
    // console.log("inside condition one", one, two);
    if(one.length > 0 && two.length > 0){
      let refKeyVal1 = one[0]['Referer'] ? one[0]['Referer'].replace(/=([A-z][a-z])\w+/g, '{{TEMP}}') : one[0]['referer'].replace(/=([A-z][a-z])\w+/g, '{{TEMP}}')
      let refKeyVal2 = two[0]['Referer']? two[0]['Referer'].replace(/=([A-z][a-z])\w+/g, '{{TEMP}}') : two[0]['referer'].replace(/=([A-z][a-z])\w+/g, '{{TEMP}}')
      console.log("values",refKeyVal1, refKeyVal2)
      return refKeyVal1 === refKeyVal2
    }else{
      return false;
    }
}
}

process.on('message', async (params) => {
  const compare = new Compare(params);
  await compare.start();
});
