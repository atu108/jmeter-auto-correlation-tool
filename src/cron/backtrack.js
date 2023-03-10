import mongoose from 'mongoose';
import config from '../config';
import logger from '../utility/logger';
import Compare from '../models/Compare';
import Difference from '../models/Difference';
import Request from '../models/Request';
import Step from "../models/Step";
import Transaction from "../models/Transaction";
import Correlation from "../models/Correlation";
import RunController from '../controllers/RunController';
const cheerio = require("cheerio");
const parse = require('tld-extract')


class Backtrack {

    constructor(params) {
        this.params = params;
        this.correlations = [];
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
        const diffs = await Difference.find({ workflow: this.params }).populate('first.request', ['sequence']).populate('second.request', ['sequence']).populate('transaction');
        const loopTimes = diffs.length;
        for (let i = 0; i < loopTimes; i++) {
            console.log(i);
            if (diffs[i].duplicate !== '') {
                continue;
            }
            let correlation = await this.searchInBodyNew(diffs[i]);
            /*
                
                check if the correlation is from url 
                if yes then store it in an array 
                now keep checking for params too
                if params correlations match the ones stored in url 
                then compare the regex of the two 
    
                compareReg function 
                count number of regex in both the two
                if greater store that one
                if same
                then compare both strings with the original string found 
                wich ever has the larger length store that regex and ignore the other one
                findAnchoreTagUsingParams function
                find achore tags wich containes the respective key value pairs and form regex acordingly

            */
            if (correlation) {
                console.log("found one", correlation);
                this.correlations.push(correlation);
            }
        }
        process.send({
            correlations: this.correlations
        });
    }

    async _searchInBody(diff) {
        if (diff.location === 'url') {
            // console.log("url found");
            return false;
        }
        //prepare regex for both run
        // search in run 1
        // if found then get the url and session from 1st
        // then find in second run with constarints of url and session number
        // if the numbers of results are multiple then start from bottom
        // pick run 1 bottom req url and match with the second run and continue with each one then for each req follow below steps
        //if multiple matches found in same url
        // then find the best match using fix boundry fucntionswritten
        //finally find the regex count and then optimal reg number // hamare kaam ka kaon sa hai will be used in creation of JMX.

        let key = diff.key.split('U+FF0E').join('.');
        let value1 = diff.first.value.replace('+', ' ');
        let value2 = diff.second.value.replace('+', ' ');

        // console.log(diff._id,value1, value2);

        let stepSeq = [diff.first.request.sequence, diff.second.request.sequence];

        let runs = [diff.first.run, diff.second.run];
        const regArr = [`<(.*?)${key}=${(value1).replace('+', ' ')}(.*?)>`, `<(.*?)${key}(.[^<]*?)${value1.replace('+', ' ')}(.*?)>`, `<(.*?)${value1.replace('+', ' ')}(.[^<]*?)${key}(.*?)>`];
        const regArr1 = [`<(.*?)${key}=${value2.replace('+', ' ')}(.*?)>`, `<(.*?)${key}(.[^<]*?)${value2.replace('+', ' ')}(.*?)>`, `<(.*?)${value2.replace('+', ' ')}(.[^<]*?)${key}(.*?)>`];

        for (let i = 0; i < regArr.length; i++) {
            const reg = new RegExp(regArr[i], 'i');
            const reg1 = new RegExp(regArr1[i], 'i');
            //console.log("step sequence here", stepSeq);
            const matched1 = await Request.find({
                run: runs[0],
                sequence: { $lt: stepSeq[0] },
                'response.body': reg,
            }).sort({ step_sequence: -1 }).populate('transaction');
            //console.log(matched1);
            if (matched1.length < 1) continue;

            //added url check in run2
            const matched2 = await Request.find({
                run: runs[1],
                url: matched1[0].url,
                txn_sequence: matched1[0].txn_sequence,
                'response.body': reg1
            }).sort({ step_sequence: -1 }).populate('transaction');
            const matched = matched1[0].response.body.match(new RegExp(regArr[i].replace('<(.*?)', '(.[^<]*?)').replace('(.*?)>', '(.*?)>{1}'), 'gi'));
            const matchedOtherRun = matched2.length > 0 ? matched2[0].response.body.match(new RegExp(regArr1[i].replace('<(.*?)', '(.[^<]*?)').replace('(.*?)>', '(.*?)>{1}'), 'gi')) : 'NA';

            let finalReg = {};

            if (matchedOtherRun !== 'NA') {
                // console.log("matched arry1", matched);
                // console.log("matched arry2", matchedOtherRun);
                finalReg = this._finalReg(matched, matchedOtherRun, [value1, value2], key, i)
                // console.log("final reg", finalReg);
            }

            return {
                key: key,
                priority: 1,
                compared_url: diff.url,
                location: diff.location,
                reg_count: finalReg.hasOwnProperty('reg') ? this._countReg(finalReg['reg']) : 'NA',
                optimal_reg_number: '',
                reg: regArr[i],
                final_regex: finalReg.hasOwnProperty('reg') ? finalReg['reg'] : false,
                first: {
                    url: matched1[0].url,
                    matched: finalReg.hasOwnProperty('pos1') ? matched[finalReg['pos1']] : matched.join('||'),
                    txn_title: matched1[0].transaction.title,
                    txn_sequence: matched1[0].transaction.sequence,
                    request: matched1[0]._id,
                    run: matched1[0].run

                },
                second: {
                    url: matched2[0] ? matched2[0].url : 'NA',
                    matched: finalReg.hasOwnProperty('pos2') ? matchedOtherRun[finalReg['pos2']] : matchedOtherRun !== 'NA' ? matchedOtherRun.join('||') : 'NA',
                    txn_title: matched2[0].transaction.title,
                    txn_sequence: matched2[0].transaction.sequence,
                    request: matched2[0]._id,
                    run: matched2[0].run

                },
                workflow: diff.workflow
            }

        }

        return false;
    }

    _countReg(str) {
        let regcount = '';
        const count = str.split('(.*?)').length;
        for (let i = 1; i < count; i++) {
            regcount += `$${i}$`;
        }
        return regcount;
    }

    _finalReg(matched, matchedOtherRun, values, key, caseNo) {
        if (caseNo === "url") {
            if (matched[0].replace(values[0], '') === matchedOtherRun[0].replace(values[1], '')) {
                return {
                    reg: matched[0].replace(values[0], '(.*?)'),
                    pos1: 0,
                    pos2: 0
                };
            } else {
                return false;
            }
        }
        const length1 = matched.length;
        const length2 = matchedOtherRun.length;
        const temp = length1 - length2;
        let i;
        let j;
        if (temp === 0) {
            for (i = 0; i < length1; i++) {
                // console.log("values", values);
                // console.log(matched, "------", matchedOtherRun);
                // console.log("inside final 1",matched[i].replace(values[0], ''));
                // console.log("inside final 2",matchedOtherRun[i].replace(values[1], ''));

                if (matched[i].replace(values[0], '') === matchedOtherRun[i].replace(values[1], '')) {
                    return {
                        reg: matched[i].replace(values[0], '(.*?)'),
                        pos1: i,
                        pos2: i
                    };
                }
            }
            return {
                reg: `${this._fixBoundary(matched[0], matchedOtherRun[0]) !== false ? this._fixBoundary(matched[0], matchedOtherRun[0]) + '>' : false}`,
                pos1: 0,
                pos2: 0
            };
        }
        if (temp < 0) {
            for (i = 0; i < length2; i++) {
                for (j = 0; j < length1; j++) {
                    if (matched[j].replace(values[0], '') === matchedOtherRun[i].replace(values[1], '')) {
                        return {
                            reg: matched[j].replace(values[0], '(.*?)'),
                            pos1: j,
                            pos2: i
                        };
                    }
                }
            }
            return {
                reg: `${this._fixBoundary(matched[0], matchedOtherRun[0]) !== false ? this._fixBoundary(matched[0], matchedOtherRun[0]) + '>' : false}`,
                pos1: 0,
                pos2: 0
            };
        }
        if (temp > 0) {
            for (i = 0; i < length1; i++) {
                for (j = 0; j < length2; j++) {
                    if (matched[i].replace(values[0], '') === matchedOtherRun[j].replace(values[1], '')) {
                        return {
                            reg: matched[j].replace(values[0], '(.*?)'),
                            pos1: i,
                            pos2: j
                        };
                    }
                }
            }
            return {
                reg: `${this._fixBoundary(matched[0], matchedOtherRun[0]) !== false ? this._fixBoundary(matched[0], matchedOtherRun[0]) + '>' : false}`,
                pos1: 0,
                pos2: 0
            };
        }
        return false;
    }

    _fixBoundary(str1, str2, values, ) {
        console.log("checking sts", str1, str2);
        let temp = [str1.replace(values[0], '(.*?)'), str2.replace(values[1], '(.*?)')]
        //for cheching its anchor tag
        if (str1.substring(0, 3) !== '<a ') {
            if (temp[0] === temp[1])
                return temp[0];
        }

        // console.log("strings ", str1, str2)
        const arr1 = temp[0].split(' ');
        const arr2 = temp[1].split(' ');
        // console.log("both arrys", arr1, arr2);
        if (arr1.length < 1 || arr1.length < 1) return false;
        const obj1 = this._parseTag(arr1);
        // console.log("object parsed 1 ",obj1)
        const obj2 = this._parseTag(arr2);
        // console.log("object parsed 2 ",obj2)
        // console.log(obj2)
        if (!obj1 || !obj2) return false;
        return this._compareObj(obj1, obj2);
    }
    //this is to compare tag by tab rather than characters while trying to find the final regex
    _parseTag(str) {
        console.log("in parse tag", str);
        const len1 = str.length;
        let obj = {};
        // console.log(str[0]);
        obj['tag'] = str[0].slice(1, str[0].length);
        for (let i = 1; i < len1; i++) {
            if (str[i].indexOf('=') === -1) return false;
            // console.log("reached inside")
            let temp = str[i].split(/=(.+)/);
            if (len1 - 1 === i) {
                obj[temp[0]] = temp[1].slice(0, -1);
            } else {
                obj[temp[0]] = temp[1];
            }
        }
        return obj;
    }
    //comapres the different components of a tag whether two tags are equal if not make them same by replacing non matching words or components
    _compareObj(obj1, obj2) {
        let str = '';
        for (let x in obj1) {
            //checking the property in other obj
            if (obj2.hasOwnProperty(x)) {

                //check if the value is url
                if (this._isURL(obj1[x])) {
                    str = `${str} ${x}=${this._compareUrl(obj1[x], obj2[x])}`
                } else {
                    //check if value is tag
                    if (x === 'tag') {
                        //check if both tags are same
                        if (obj1[x] === obj2[x]) {
                            //modify str
                            str = `${str}<${obj1[x]}`;
                        } else {
                            str = `${str}<(.*?)`
                        }

                    } else {
                        if (obj1[x] === obj2[x]) {
                            str = `${str} ${x}=${obj1[x]}`
                        } else {
                            str = `${str} ${x}=(.*?)`
                        }
                    }

                }
            }
        }
        //console.log("str",str);
        return str;
    }
    // this to comapre urls and fix their param values
    _compareUrl(url1, url2) {
        //to do:- handle whole url rather than only params
        // console.log("reached inside url match", url1, "url 2", url2)
        try {
            const loc1 = new URL(url1);
            const loc2 = new URL(url2);
            let params1 = loc1.searchParams;
            let params2 = loc2.searchParams;
            let host1 = loc1.hostname;
            let host2 = loc2.hostname;
            let pathNames1 = loc1.pathname.split('/');
            let pathNames2 = loc2.pathname.split('/');
            if (host1 !== host2) {
                loc1.hostname = '(.*?)';
            }
            for (let i = 0; i < pathNames1.length; i++) {
                if (pathNames1[i] !== pathNames2[i]) {
                    pathNames1[i] = '(.*?)';
                }
            }
            loc1.pathname = pathNames1.join('/');
            for (const [name, value] of params1) {
                if (params2.has(name)) {
                    if (params2.get(name) !== value) {
                        loc1.searchParams.set(name, '(.*?)')
                    }
                }

            }
            return decodeURIComponent(loc1.href);
        } catch (e) {
            //
            return this._compareRelativeUrl(url1, url2)
        }

    }

    _compareRelativeUrl(url1, url2) {
        const splitWithQuestionUrl1 = url1.split('?');
        const splitWithQuestionUrl2 = url2.split('?');
        const pathsArrayUrl1 = splitWithQuestionUrl1[0].split('/').map(p => p.trim() === '' ? '{{TEMP}}' : p);
        const pathsArrayUrl2 = splitWithQuestionUrl2[0].split('/').map(p => p.trim() === '' ? '{{TEMP}}' : p);
        let allKeyValue1 = {};
        let allKeyValue2 = {};
        if (splitWithQuestionUrl1.length > 1) {
            splitWithQuestionUrl1[1].split('&').forEach((str) => {
                allKeyValue1[str.split("=")[0]] = str.split("=")[1]
            })
            splitWithQuestionUrl2[1].split('&').forEach((str) => {
                allKeyValue2[str.split("=")[0]] = str.split("=")[1]
            })
        }

        let path = [];
        for (let i = 0; i < pathsArrayUrl1.length; i++) {
            if (pathsArrayUrl1[i] === pathsArrayUrl2[i]) {
                path.push(pathsArrayUrl1[i])
            } else {
                path.push("(.*?)")
            }
        }
        let queryParams = [];
        for (let key in allKeyValue1) {
            if (allKeyValue1[key] === allKeyValue2[key]) {
                queryParams.push(key + "=" + allKeyValue1[key])
            } else {
                queryParams.push(key + "=" + "(.*?)")
            }
        }
        if (splitWithQuestionUrl1.length > 1) {
            return (path.join('/') + "?" + queryParams.join("&amp;")).replace('{{TEMP}}', '')
        } else {
            return path.join('/').replace('{{TEMP}}', '');
        }
    }
    // check if a string url
    _isURL(str) {
        let pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?' + // port
            '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
            '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

        return pattern.test(str);
    }


    async _whichFile(id) {
        if (id === false) {
            return {
                file: 'Not Found',
                sequence: 'Not Found',
            }
        }
        const transaction = await Transaction.find({ _id: id });
        return {
            file: transaction[0].title,
            sequence: transaction[0].sequence,
        }
    }

    async searchInBodyNew(diff) {
        let key = diff.key.split('U+FF0E').join('.');
        let value1 = diff.first.value.replace('+', ' ');
        let value2 = diff.second.value.replace('+', ' ');
        let finalReg = '';
        // console.log(diff.first.request)
        let stepSeq = [diff.first.request.sequence, diff.second.request.sequence];
        //console.log("differnce sequence number", diff.first.request.sequence);
        // console.log("inside new serach", key, "--", value1, "--",value2);
        //console.log("step sequence",stepSeq[0])
        let runs = [diff.first.run, diff.second.run];
        const allRequests = await Request.find({ run: runs[0], sequence: { $lt: stepSeq[0] } }).sort({ sequence: -1 });
        //const allRequests = await Request.find({_id:"5c4beb1ed5f904246e9a2103"});
        for (let i = 0; i < allRequests.length; i++) {
            // console.log("diff id---",diff._id, '---------------------', "sequence----", i, "request sequence ------",  allRequests[i].sequence, "value1---", value1)
            // console.log("type of id and all ids", typeof allRequests[i]._id, allRequests[i]._id)
            // if(allRequests[i]._id == '5c4beb1ed5f904246e9a2103'){
            //     console.log("----------------------got desired request id-----------------------------------------------")
            //     console.log("session", allRequests[i].session_sequence)
            //     console.log("sequence", allRequests[i].sequence)
            // }
            //console.log("counting session",allRequests[i].session_sequence, allRequests[i].sequence)
            let body = allRequests[i].response.body;
            if (body === undefined || !body || body == '') {
                // console.log("called here inside not body", allRequests[i].sequence);
                // console.log("response status", allRequests[i].response.status)
                if (allRequests[i].response.status < 300 || allRequests[i].response.status > 399) {
                    continue;
                }
            }

            //for searching diff in response body is in json form
            // check body type to be application/json
            // console.log("response type", allRequests[i].response.mime_type);
            if (allRequests[i].response.mime_type == 'application/json') {
                // console.log("one json body found")
                // parse body and split the diff key with unique identifire used for saving post data in request
                let parentsInKey = key.split("$#$");
                // console.log("all parsed keys", parentsInKey)
                try {
                    let responseBodyInJson = JSON.parse(body);
                    // console.log("json body",body)
                    if (value1 == eval(`responseBodyInJson.${parentsInKey.join('.')}`)) {
                        let second = await Request.find({ run: runs[1], url: request.url, txn_sequence: request.txn_sequence, 'request.method': request.request.method });
                        // to do : Refactor code for resuability for finding parent
                        // console.log("json found second", second)
                        if (!second[0]) {

                            const findParent = await Difference.find({ "key": key });
                            // console.log("json parent", findParent);
                            if (findParent[0]) {
                                second = await Request.find({ _id: findParent[0].second.request });
                            }
                        }
                        if (second.length > 0) {
                            // console.log("json found second", second)
                            if (second[0].response.mime_type == 'application/json') {
                                if (value1 == eval(`responseBodyInJson.${parentsInKey.join('.')}`)) {
                                    // console.log("found in bothn json body", value1)
                                }
                            }
                        }
                    } else {
                        continue;
                    }
                } catch (e) {
                    continue;
                }

                // then find the key value as nest object key value

            }

            // for searching the differences in url

            if (diff.location === 'url') {
                // console.log("response status =====>", allRequests[i].response.status, ", sequnce => ", allRequests[i].sequence)

                /*
                    Seraching implimented for respose status 300 to 399 for current body
                    for finding url in header under location
                    after finding location find that url and then find in that else find prents diff location url

                    - Rest will found using _findInAchor tag 
                */
                if (allRequests[i].response.status > 299 && allRequests[i].response.status < 400) {
                    // console.log("****************  *************** inside 300 reauets **************************************")
                    //await this.findAnchorTagInHeader(body, value1, value2, allRequests[i], diff, runs)
                    console.log("sequence inside 300 to 400 requests", allRequests[i].sequence);
                    let indexOfLocation = allRequests[i].response.headers.findIndex(function findLocationKey(header) {
                        let tempKey = Object.keys(header)[0];
                        return tempKey.toLowerCase() == 'location' && header[tempKey] == value1;
                    })

                    if (indexOfLocation != -1) {
                        let second = await Request.find({ run: runs[1], url: allRequests[i].url, txn_sequence: allRequests[i].txn_sequence, 'request.method': allRequests[i].request.method });
                        // console.log("input response", second[0]);
                        //if did not find with same url as run 1 then find in its parents in diffrence
                        if (!second[0]) {
                            const findParent = await Difference.find({ "first.value": allRequests[i].url });
                            console.log(findParent);
                            if (findParent[0]) {
                                //second = await Request.find({ run: runs[1], url: findParent[0].second.value, txn_sequence: allRequests[i].txn_sequence, 'request.method': allRequests[i].method });
                                second = await Request.find({ _id: findParent[0].second.request });
                            }
                        }
                        if (second[0]) {
                            let indexOfLocation = second[0].response.headers.findIndex(function findLocationKey(header) {
                                let tempKey = Object.keys(header)[0];
                                return tempKey.toLowerCase() == 'location' && header[tempKey] == value2;
                            })
                            if (indexOfLocation != -1) {
                                //return this._anchorCorrelationFinal(second, value1, value2, newBody1, newBody2, diff, request, splitWith, value1)
                                let finalReg = this._compareUrl(value1, value2);
                                let reg_name = this._getHrefRegName(finalReg, value1)
                                finalReg = 'Location: ' + finalReg + '\\s';
                                // console.log("302 reg name", reg_name);
                                return {
                                    key: key,
                                    priority: 1,
                                    compared_url: diff.url,
                                    location: diff.location,
                                    reg_count: this._countReg(finalReg),
                                    reg_name: reg_name,
                                    final_regex: finalReg,
                                    reg_final_name: diff._id,
                                    first: {
                                        url: allRequests[i].url,
                                        matched: value1,
                                        txn_title: allRequests[i].transaction.title,
                                        txn_sequence: allRequests[i].transaction.sequence,
                                        request: allRequests[i]._id,
                                        run: allRequests[i].run,
                                        atPos: 0

                                    },
                                    second: {
                                        url: second[0].url,
                                        matched: value2,
                                        txn_title: second[0].transaction.title,
                                        txn_sequence: second[0].transaction.sequence,
                                        request: second[0]._id,
                                        run: second[0].run,
                                        atPos: 0

                                    },
                                    workflow: diff.workflow,
                                    difference: diff._id
                                }
                                // regex will be from by just comapring the urls as above
                                // now get the nameof the reg as g1 g2 by just macthing the original values and then replaing
                                // values with cor or cor_g<number>
                                // then pick that correlarion object and push it in correlaration array

                            }
                        }
                    }
                    return false;
                }
                let result = await this._findAchorTag(body, value1, value2, allRequests[i], diff, runs);
                if (result) {
                    return result;
                }

            }

            let tags = {}
            tags.value = this.findInput(body, key, value1);
            tags.type = 1
            if (!tags.value) {
                tags.value = this.findSelect(body, key, value1);
                tags.type = 2
            }
            if (tags.value && tags.value.length > 0) {
                let second = await Request.find({ run: runs[1], url: allRequests[i].url, txn_sequence: allRequests[i].txn_sequence, 'request.method': allRequests[i].request.method });
                //if did not find with same url as run 1 then find in its parents in diffrence
                if (!second[0]) {
                    const findParent = await Difference.find({ "first.value": allRequests[i].url });
                    if (findParent[0]) {
                        //second = await Request.find({ run: runs[1], url: findParent[0].second.value, txn_sequence: allRequests[i].txn_sequence, 'request.method': allRequests[i].method });
                        second = await Request.find({ _id: findParent[0].second.request });
                    }

                }
                if (!second[0]) {
                    return false;
                }
                let sencondTags = [];
                if (tags.type === 1) {
                    sencondTags = this.findInput(second[0].response.body, key, value2);
                } else {
                    sencondTags = this.findSelect(second[0].response.body, key, value2);
                }

                if (sencondTags.length > 0) {
                    let forFinalReg = this.checkExactMatch(tags.value, sencondTags);
                    if (!forFinalReg) {
                        forFinalReg = this.checkLooseMatch(tags.value, sencondTags);
                    }
                    if (forFinalReg) {
                        //removed empty space with + in cheerio returned object
                        forFinalReg[0].attribs.value = forFinalReg[0].attribs.value.replace(" ", '+');
                        forFinalReg[1].attribs.value = forFinalReg[1].attribs.value.replace(" ", '+');
                        finalReg = this._fixBoundary(cheerio.html(forFinalReg[0]), cheerio.html(forFinalReg[1]), [value1, value2]);
                        //closing tag has been done to fix if 
                        //the fix boundry has removed last closing tag then add one else dont
                        let closingTag = '>'
                        if (finalReg[finalReg.length - 1] == '>') {
                            closingTag = ''
                        }
                        finalReg = finalReg + closingTag;
                        const reg_name = this._getRegName(finalReg, cheerio.html(forFinalReg[0]), value1, key)
                        finalReg = this.verifyTagClosing(body, finalReg, value1);
                        console.log("final reg after modification", finalReg)
                        return {
                            key: key,
                            priority: 1,
                            compared_url: diff.url,
                            location: diff.location,
                            reg_count: this._countReg(finalReg),
                            reg_name: reg_name,
                            final_regex: finalReg,
                            reg_final_name: diff._id,
                            first: {
                                url: allRequests[i].url,
                                matched: cheerio.html(forFinalReg[0]),
                                txn_title: allRequests[i].transaction.title,
                                txn_sequence: allRequests[i].transaction.sequence,
                                request: allRequests[i]._id,
                                run: allRequests[i].run,
                                atPos: 0

                            },
                            second: {
                                url: second[0].url,
                                matched: cheerio.html(forFinalReg[1]),
                                txn_title: second[0].transaction.title,
                                txn_sequence: second[0].transaction.sequence,
                                request: second[0]._id,
                                run: second[0].run,
                                atPos: 0

                            },
                            workflow: diff.workflow,
                            difference: diff._id
                        }
                    }
                }
            }
        }
        return false;
    }


    verifyTagClosing(body, reg, value) {
        let strippedClosingRegTag = reg.substring(0, reg.length - 1)
        let possibleReg = [
            reg,
            strippedClosingRegTag + ' />',
            strippedClosingRegTag + '/>',
            strippedClosingRegTag + ' >'
        ]
        for (let i = 0; i < possibleReg.length; i++) {
            let matched = body.match(new RegExp(possibleReg[i], 'gi'))
            if (Array.isArray(matched)) {
                // return possibleReg[i]; 
                for (let j = 0; j < matched.length; j++) {
                    let tempMatch = matched[j].match(new RegExp(possibleReg[i]))
                    // console.log("value match",))
                    // console.log("value ", value)
                    if (tempMatch[1] == value) {
                        return possibleReg[i];
                    }
                }
            }
        }
        return false;
    }
    checkExactMatch(tag, tag2) {
        try {
            for (let i = 0; i < tag.length; i++) {
                const index = tag2.findIndex(tg => tag[i].type === tg.type &&
                    tag[i].name === tg.name &&
                    tag[i].parent.type === tg.parent.type &&
                    tag[i].parent.name === tg.parent.name &&
                    ((tag[i].next && tag[i].next.type === tg.next.type && tag[i].next.type === 'tag' && tag[i].next.name === tg.next.name)
                        || (tag[i].next && tag[i].next.type === tg.next.type && tag[i].next.type === 'text' && tag[i].next.body === tg.next.body)) &&
                    ((tag[i].prev && tag[i].prev.type === tg.prev.type && tag[i].prev.type === 'tag' && tag[i].prev.name === tg.prev.name)
                        || (tag[i].prev && tag[i].prev.type === tg.prev.type && tag[i].prev.type === 'text' && tag[i].prev.body === tg.prev.body))
                )
                if (index !== -1) {
                    return [tag[i], tag2[index]];
                }
            }
            return false;
        } catch (e) {
            return false
        }

    }

    checkLooseMatch(tag, tag2) {
        for (let i = 0; i < tag.length; i++) {
            const index = tag2.findIndex(tg => tag[i].type === tg.type &&
                tag[i].name === tg.name &&
                tag[i].parent.type === tg.parent.type
                // && tag[i].parent.name === tg.parent.name
            )
            if (index !== -1) {
                return [tag[i], tag2[index]];
            }
        }
        return false;
    }

    findInput(body, key, value) {
        // console.log("--------------------------------------------------------------------------------------------------------------------------")
        // console.log("input key", key, "value", value)
        try {
            let $ = cheerio.load(body.replace((/\\/g, "")));
            // console.log(body)
            let inputs = $('input[name="' + key + '"][value="' + value + '"]').toArray();
            // console.log("inputs check all inouts", inputs);
            if (inputs.length > 0) {
                return inputs;
                // return inputs;
            } else {
                return false;
            }
        } catch (e) {
            return false;
            console.log(e);
        }


    }

    findSelect(body, key, value) {
        try {
            let $ = cheerio.load(body.replace((/\\/g, "")));
            let selects = $('select[name="' + key + '"] option[value="' + value + '"]').toArray;
            if (selects.length > 0) {
                return selects;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }

    }


    // take in an url and a return type and return
    // parameters of the url in obj defualt or string
    getUrlParameters(url, type = 'Obj') {
        const loc = new URL(url);
        if (type == 'Obj') {
            let obj = {}
            for (let [name, value] of loc.searchParams) {
                obj[name] = value
            }
            return obj;
        } else if (type == 'String') {
            // console.log("search param", loc.search)
            return loc.search.split('&')[1]
        }
    }

    findParamsInAchorTag(body, keyValue) {
        try {
            let $ = cheerio.load(body.toString(), { xml: { decodeEntities: false, lowerCaseAttributeNames: false } });
            // let $ = cheerio.load(body.replace((/\\/g, "")));
            let anchorTags = $(`a[href*='${keyValue}']`).toArray();
            // console.log("inputs check", typeof inputs, "all inouts", inputs[0]);
            if (anchorTags.length > 0) {
                return anchorTags;
                // return inputs;
            } else {
                return false;
            }
        } catch (e) {
            return false;
            console.log(e);
        }
    }

    findParamsInFormTag(body, keyValue) {
        //console.log(body, "-------------------------------------------------",keyValue);
        try {
            let $ = cheerio.load(body.toString(), { xml: { decodeEntities: false, lowerCaseAttributeNames: false } });
            // let $ = cheerio.load(body.replace((/\\/g, "")));
            let formTags = $(`form[action*='${keyValue}']`).toArray();
            // console.log("inputs check", typeof inputs, "all inouts", inputs[0]);
            if (formTags.length > 0) {
                return formTags;
                // return inputs;
            } else {
                return false;
            }
        } catch (e) {
            return false;
            console.log(e);
        }
    }

    _getRegName(final, matched, value, key) {
        // console.log("final reg",final)
        // console.log("matched",matched)
        // console.log("value",value)
        // console.log("key",key)
        let toReplace = [];
        let withWhat = []
        let resultArr = matched.match(new RegExp(final))
        if (resultArr.length === 2) {
            toReplace.push(resultArr[1])
            withWhat.push("COR")
            // return key + "_COR"
        } else {
            for (let i = 1; i < resultArr.length; i++) {
                if (resultArr[i].replace(/"/g, '').replace(/'/g, '') === value) {
                    toReplace.push(resultArr[i])
                    withWhat.push(key + "COR_g" + i)
                    // return key + "_COR_g" + i;
                } else {
                    console.log(resultArr[i].replace('"', '', g))
                }
            }
        }
        return {
            toReplace,
            withWhat
        }
    }

    _getHrefRegName(final, matched) {
        let toReplace = [];
        let withWhat = [];
        final = final.replace(/[^\*\?](\W\?)/g, '{{TEMP}}');
        final = final.replace(/\?/g, "\\?").replace(/{{TEMP}}/g, ".*?")
        console.log("herf regex", final)
        matched = matched.replace(/&/g, "&amp;") + '/'
        let resultArr = matched.match(final + '/')
        console.log("result arr", resultArr)
        if (resultArr && resultArr.length === 2) {
            toReplace.push(resultArr[1])
            withWhat.push("COR")
        } else if (resultArr) {
            for (let i = 1; i < valuesInHref.length; i++) {
                toReplace.push(valuesInHref[i]);
                withWhat.push("COR_g" + resultArr.indexOf(valuesInHref[i]))
            }
        }
        // key+"_COR_g"+i
        return {
            toReplace,
            withWhat
        }
    }
    _getAnchorRegName(final, matched, value, condition, splitWith) {
        let toReplace = [];
        let withWhat = [];
        // console.log("checking cndition", condition);
        // console.log("matched", matched)
        // console.log("value", value)
        if (condition === 3 || condition === 5) {
            value = value.split(`.${splitWith}/`)[1]
        } else if (condition === 4 || condition === 6) {
            value = value.split(`.${splitWith}`)[1]
        }
        value = value.replace(/&/g, "&amp;") + '/'
        // console.log(value)
        let regHref = final.match(/<a\s+(?:[^>]*?\s+)?href="([^"]*)/)[1];
        regHref = regHref.replace(/[^\*\?](\W\?)/g, '{{TEMP}}');
        regHref = regHref.replace(/\?/g, "\\?").replace(/{{TEMP}}/g, ".*?");
        let valuesInHref = value.match(regHref + '/');
        if (regHref === '(.*?)') {
            valuesInHref = ['', value.slice(0, -1)];
        }
        // console.log(valuesInHref)
        final = final.replace(/[^\*\?](\W\?)/g, '{{TEMP}}');
        final = final.replace(/\?/g, "\\?").replace(/{{TEMP}}/g, ".*?")
        let resultArr = matched.match(final)
        // console.log(resultArr)
        if (resultArr && resultArr.length === 2) {
            toReplace.push(resultArr[1])
            withWhat.push("COR")
        } else if (resultArr) {
            for (let i = 1; i < valuesInHref.length; i++) {
                toReplace.push(valuesInHref[i]);
                withWhat.push("COR_g" + resultArr.indexOf(valuesInHref[i]))
            }
        }
        // key+"_COR_g"+i
        return {
            toReplace,
            withWhat
        }
    }
    _getFormRegName(final, matched, value, condition, splitWith) {
        // console.log("Final before-------", final);
        let toReplace = [];
        let withWhat = [];
        // console.log("checking cndition", condition);
        // console.log("matched", matched)
        // console.log("value", value)
        if (condition === 3 || condition === 5) {
            value = value.split(`.${splitWith}/`)[1]
        } else if (condition === 4 || condition === 6) {
            value = value.split(`.${splitWith}`)[1]
        }
        value = value.replace(/&/g, "&amp;") + '/'
        // console.log(value)
        let regHref = final.match(/<(.*?)action="([^"]*)/)[2];
        // regHref = regHref.replace(/[^\*\?](\W\?)/g, '{{TEMP}}');replace(/[^\*\?](\W\?)/g, '{{TEMP}}')
        // console.log("check href reg for form ---- 1 ", regHref)
        // regHref = regHref.replace(/\?/g, "\\?").replace(/{{TEMP}}/g, ".*?");
        // console.log("check href reg for form ---- 2 ", regHref)
        regHref= regHref.replace(/[^\*\?](\W\?)/g, '{{TEMP}}');
        // console.log("before after temp ------", final)
        regHref = regHref.replace(/\?/g, "\\?").replace(/{{TEMP}}/g, ".*?")
        let valuesInHref = value.match(regHref + '/');
        // console.log("check href reg for form ----  3 ", regHref)
        if (regHref === '(.*?)') {
            valuesInHref = ['', value.slice(0, -1)];
        }
        // console.log(valuesInHref)
        final = final.replace(/[^\*\?](\W\?)/g, '{{TEMP}}');
        // console.log("before after temp ------", final)
        final = final.replace(/\?/g, "\?").replace(/{{TEMP}}/g, ".*?")
        // console.log("Final after----------", final)
        let resultArr = matched.replace(/&amp;amp;/g,'&amp;').match(final)
        // console.log("matched ------------", matched);
        // console.log("result arr------", resultArr);
        // console.log(resultArr)
    
        if (resultArr && resultArr.length === 2) {
            toReplace.push(resultArr[1])
            withWhat.push("COR")
        } else if (resultArr) {
            for (let i = 1; i < valuesInHref.length; i++) {
                toReplace.push(valuesInHref[i]);
                withWhat.push("COR_g" + resultArr.indexOf(valuesInHref[i]))
            }
        }
        // key+"_COR_g"+i
        return {
            toReplace,
            withWhat
        }
    }

    async _findAchorTag(body, value1, value2, request, diff, runs) {
        //console.log("diff id---",diff._id, '---------------------', "sequence----", "request sequence ------",  request.sequence, "value1---", value1)
        try {
            /**************** Discription of this function *********************************
            * 
            *  In this function we are finding urls which are different in achortags and making regjex 
            *  There are 6 conditions to find anchor tags with href value 
            *  spliting with .com means we are looking for relative urls
            *  if found in first search in run2 request body which has same session sequence and same url and method 
            *  if it doesnt exist check if its mismacth url 
            * if yes then find the corresponding parent url and then search in the body of parent
            *  after having both matched anchortags from both run 
            * then send them for comparision and for making reg using function matchAnchorTags
            *  when reg is made then find the coreence of in respect runs using function verifyAnchorTag
            */
            const splitWith = parse(value1).tld;
            /**
             * @todo
             *  Fix multiple condition checking with map object
             */
            let condition = 0;
            // console.log("values to find", value1, value2)
            let newBody1 = body.replace(/\\/g, "")
            let $ = cheerio.load(newBody1.toString(), { xml: { decodeEntities: false, lowerCaseAttributeNames: false } });
            let anchor1 = $('a[href="' + value1 + '"]').toArray();
            // console.log("with double and domain", anchor1);
            condition = anchor1.length > 0 ? 1 : condition;
            anchor1 = anchor1.length > 0 ? anchor1 : $('a[href=\'' + value1 + '\']').toArray();
            condition = anchor1.length > 0 && condition === 0 ? 2 : condition;
            // done for finding relative urls in achor tag
            anchor1 = anchor1.length > 0 ? anchor1 : $('a[href="' + value1.split(`.${splitWith}/`)[1] + '"]').toArray();
            condition = anchor1.length > 0 && condition === 0 ? 3 : condition;
            anchor1 = anchor1.length > 0 ? anchor1 : $('a[href="' + value1.split(`.${splitWith}`)[1] + '"]').toArray();
            condition = anchor1.length > 0 && condition === 0 ? 4 : condition;
            //  console.log("double quote no domain", anchor1, request.session_sequence);
            anchor1 = anchor1.length > 0 ? anchor1 : $('a[href=\'' + value1.split(`.${splitWith}/`)[1] + '\']').toArray();
            condition = anchor1.length > 0 && condition === 0 ? 5 : condition;
            anchor1 = anchor1.length > 0 ? anchor1 : $('a[href=\'' + value1.split(`.${splitWith}`)[1] + '\']').toArray();
            condition = anchor1.length > 0 && condition === 0 ? 6 : condition;
            //  console.log("single quote no domain", anchor1);
            //  anchor1 = anchor1.length > 0 ? anchor1 : $('a[href='+value1.split('.com/')[1]+']').toArray();
            //  console.log("achor1 in next search", anchor1)
            //  console.log("inputs check", typeof inputs, "all inouts", inputs[0]);
            // console.log("checking values", request.url, request.txn_sequence);
            // console.log("checkinf if found", anchor1);
            if (anchor1.length > 0) {
                // console.log("inside find one anchor req seq: -", request.sequence)
                let second = await Request.find({ run: runs[1], url: request.url, txn_sequence: request.txn_sequence, 'request.method': request.request.method });
                // console.log("second top section", second[0].response.body);
                if (!second[0]) {
                    const findParent = await Difference.find({ "first.value": request.url });
                    if (findParent[0]) {
                        second = await Request.find({ _id: findParent[0].second.request });
                    }
                }
                let newBody2 = second[0].response.body.replace((/\\/g, ""));
                $ = cheerio.load(newBody2, { xml: { decodeEntities: false, lowerCaseAttributeNames: false } })
                // console.log($);
                let anchor2 = [];
                switch (condition) {
                    case 1: {
                        anchor2 = $('a[href="' + value2 + '"]').toArray();
                        break;
                    }
                    case 2: {
                        anchor2 = $('a[href=\'' + value2 + '\']').toArray();
                        break;
                    }
                    case 3: {
                        anchor2 = $('a[href="' + value2.split(`.${splitWith}/`)[1] + '"]').toArray();
                        break;
                    }
                    case 4: {
                        anchor2 = $('a[href="' + value2.split(`.${splitWith}`)[1] + '"]').toArray();
                        break;
                    }
                    case 5: {
                        anchor2 = $('a[href=\'' + value2.split(`.${splitWith}/`)[1] + '\']').toArray();
                        break;
                    }
                    case 6: {
                        anchor2 = $('a[href=\'' + value2.split(`.${splitWith}`)[1] + '\']').toArray();
                        break;
                    }
                }
                if (anchor2.length > 0) {
                    // console.log("inside found second anchor req seq: -", request.sequence)
                    return this._anchorCorrelationFinal(second, anchor1, anchor2, newBody1, newBody2, diff, request, splitWith, value1, condition)
                    //console.log("fund anchors", anchor1, anchor2);
                }
            } else {
                /*
                    after anchor tag then check form tag 
                    then go in params
                    
                */
                // console.log("value---------", value1)
                // console.log("request sequence inside form------", request.sequence)
                // if(request.sequence == 1){
                //     console.log(newBody1)
                // }
                let newBody1 = body.replace(/\\/g, "");
                let params1 = value1.replace(/&/gi, '&amp;')
                let found1 = this.findParamsInFormTag(newBody1, params1);
                let param2 = value2.replace(/&/gi, '&amp;')
                if (found1) {
                    console.log("found first in from")
                    let second = await Request.find({ run: runs[1], url: request.url, txn_sequence: request.txn_sequence, 'request.method': request.request.method });
                    // to do : Refactor code for resuability for find parent
                    if (!second[0]) {
                        const findParent = await Difference.find({ "first.value": request.url });
                        // console.log("parent", findParent);
                        if (findParent[0]) {
                            second = await Request.find({ _id: findParent[0].second.request });
                        }
                    }
                    if (second.length > 0) {
                        console.log("found Seccond body")
                        let newBody2 = second[0].response.body.replace(/\\/g, "")
                        let found2 = this.findParamsInFormTag(newBody2, param2);
                        if (found2.length > 0) {
                            return this._formCorrelationFinal(second, found1, found2, newBody1, newBody2, diff, request, splitWith, value1, condition)
                        }
                    }
                }
                // console.log("called in side params request seq: - ", request.sequence)
                params1 = this.getUrlParameters(value1, 'String');
                param2 = this.getUrlParameters(value2, 'String');
                found1 = this.findParamsInAchorTag(newBody1, params1);
                if (found1) {
                    // console.log(" inside params found1 :-", request.sequence);
                    // console.log(value1, "found 1st in params request 1", found1)
                    let second = await Request.find({ run: runs[1], url: request.url, txn_sequence: request.txn_sequence, 'request.method': request.request.method });
                    // to do : Refactor code for resuability for find parent
                    if (!second[0]) {
                        const findParent = await Difference.find({ "first.value": request.url });
                        // console.log("parent", findParent);
                        if (findParent[0]) {
                            second = await Request.find({ _id: findParent[0].second.request });
                        }
                    }
                    if (second.length > 0) {
                        let newBody2 = second[0].response.body.replace(/\\/g, "")
                        let found2 = this.findParamsInAchorTag(newBody2, param2);
                        if (found2.length > 0) {
                            return this._anchorCorrelationFinal(second, found1, found2, newBody1, newBody2, diff, request, splitWith, value1, condition)
                        }
                    }
                }
                return false;
            }
        } catch (e) {
            console.log(e);
        }
    }

    _formCorrelationFinal(second, found1, found2, newBody1, newBody2, diff, request, splitWith, value1, condition) {
        /*
         when everything is found then this function is used to 
         create final regex and correlation documnet to insert
        */
        let forFinalReg = this.checkExactMatch(found1, found2)
        if (!forFinalReg) {
            forFinalReg = this.checkLooseMatch(found1, found2);
        }
        //console.log("forFinal reg", forFinalReg);
        if (forFinalReg) {
            //console.log("inside finak reg")
            let finalReg = this.matchFormTags(forFinalReg[0], forFinalReg[1]);
            // console.log("final---1", finalReg);
            let forFormRegNameRegex = finalReg;
            finalReg = finalReg.replace(/[^\*\?](\W\?)/g, '{{TEMP}}');
            // console.log("final----2", finalReg);
            finalReg = finalReg.replace(/\?/g, "\\?").replace(/{{TEMP}}/g, ".*?");
            // console.log("final----3", finalReg);
            finalReg = finalReg.replace("=undefined", "");
            console.log("final----4", finalReg);
            const counts = this.verifyFormTag(
                finalReg,
                [cheerio.html(forFinalReg[0]), cheerio.html(forFinalReg[1])],
                newBody1,
                newBody2
            )
            console.log("final----5", finalReg);
            const reg_name = this._getFormRegName(forFormRegNameRegex, cheerio.html(forFinalReg[0]), value1, condition, splitWith)
            // const finalReg1 = finalReg.replace(new RegExp('\\\\\\?', 'g'), '\\?')
            finalReg = finalReg.replace(/\/\/\?/g, '\?');
            return {
                key: "url",
                priority: 1,
                compared_url: diff.url,
                location: diff.location,
                reg_count: this._countReg(finalReg),
                reg_name: reg_name,
                reg_final_name: diff._id,
                final_regex: finalReg,
                first: {
                    url: request.url,
                    matched: cheerio.html(forFinalReg[0]),
                    txn_title: request.transaction.title,
                    txn_sequence: request.transaction.sequence,
                    request: request._id,
                    run: request.run,
                    atPos: counts[0] ? counts[0] : false

                },
                second: {
                    url: second[0].url,
                    matched: cheerio.html(forFinalReg[1]),
                    txn_title: second[0].transaction.title,
                    txn_sequence: second[0].transaction.sequence,
                    request: second[0]._id,
                    run: second[0].run,
                    atPos: counts[1] ? counts[1] : false

                },
                workflow: diff.workflow,
                difference: diff._id
            }
        }
    }
    _anchorCorrelationFinal(second, found1, found2, newBody1, newBody2, diff, request, splitWith, value1, condition) {
        /*
         when everything is found then this function is used to 
         create final regex and correlation documnet to insert
        */
        let forFinalReg = this.checkExactMatch(found1, found2)
        if (!forFinalReg) {
            forFinalReg = this.checkLooseMatch(found1, found2);
        }
        //console.log("forFinal reg", forFinalReg);
        if (forFinalReg) {
            //console.log("inside finak reg")
            let finalReg = this.matchAnchorTags(forFinalReg[0], forFinalReg[1]);
            finalReg = finalReg.replace(/[^\*\?](\W\?)/g, '{{TEMP}}');
            finalReg = finalReg.replace(/\?/g, "\\?").replace(/{{TEMP}}/g, ".*?");
            finalReg = finalReg.replace("=undefined", "");
            console.log("final", finalReg);
            const counts = this.verifyAnchorTag(
                finalReg,
                [cheerio.html(forFinalReg[0]), cheerio.html(forFinalReg[1])],
                newBody1,
                newBody2
            )
            const reg_name = this._getAnchorRegName(finalReg, cheerio.html(forFinalReg[0]), value1, condition, splitWith)
            //console.log("regex name ",reg_name);
            finalReg = counts[2].replace(/\?/g, "\?").replace(/{{TEMP}}/g, ".*?")
            return {
                key: "url",
                priority: 1,
                compared_url: diff.url,
                location: diff.location,
                reg_count: this._countReg(finalReg),
                reg_name: reg_name,
                reg_final_name: diff._id,
                final_regex: finalReg.replace('&amp;', '&'),
                first: {
                    url: request.url,
                    matched: cheerio.html(forFinalReg[0]),
                    txn_title: request.transaction.title,
                    txn_sequence: request.transaction.sequence,
                    request: request._id,
                    run: request.run,
                    atPos: counts[0] ? counts[0] : false

                },
                second: {
                    url: second[0].url,
                    matched: cheerio.html(forFinalReg[1]),
                    txn_title: second[0].transaction.title,
                    txn_sequence: second[0].transaction.sequence,
                    request: second[0]._id,
                    run: second[0].run,
                    atPos: counts[1] ? counts[1] : false

                },
                workflow: diff.workflow,
                difference: diff._id
            }
        }
    }
    matchAnchorTags(obj1, obj2) {
        // console.log("checking tag objects", obj1, obj2);
        let anchor1props = obj1.attribs;
        let anchor2props = obj2.attribs;
        //console.log("checking anchor props", anchor1props, anchor2props);
        //console.log("reached till props", anchor1props)
        let allKeys1 = Object.keys(anchor1props);
        let forCreating = {}
        for (let i = 0; i < allKeys1.length; i++) {
            if (anchor1props[allKeys1[i]] === anchor2props[allKeys1[i]]) {
                // console.log(forCreating[allKeys1[i]], "in side matched propres value", anchor1props[allKeys1[i]])
                forCreating[allKeys1[i]] = anchor1props[allKeys1[i]]
            } else if (allKeys1[i] === 'href') {
                const comparedUrls = this._compareUrl(anchor1props[allKeys1[i]], anchor2props[allKeys1[i]]);
                forCreating[allKeys1[i]] = comparedUrls;
            } else {
                forCreating[allKeys1[i]] = '(.*?)';
            }
        }
        //   console.log("for creating", forCreating);
        let allProps = Object.keys(forCreating);
        let tag = '<a'
        for (let i = 0; i < allProps.length; i++) {
            if(!forCreating[allProps[i]]){
                /*
                    if only property is there just keep the property without its = and its blank value
                    eg <a ...... method="post" data-prevent-resubmission=""> should be <a ...... method="post" data-prevent-resubmission>
                */
                tag += ` ${allProps[i]}`
            }else{
                tag += ` ${allProps[i]}="${forCreating[allProps[i]]}"`
            }
        }
        tag += '>'
        return tag;
    }
    matchFormTags(obj1, obj2) {
        // console.log("checking tag objects", obj1, obj2);
        let anchor1props = obj1.attribs;
        let anchor2props = obj2.attribs;
        //console.log("checking anchor props", anchor1props, anchor2props);
        //console.log("reached till props", anchor1props)
        let allKeys1 = Object.keys(anchor1props);
        let forCreating = {}
        for (let i = 0; i < allKeys1.length; i++) {
            if (anchor1props[allKeys1[i]] === anchor2props[allKeys1[i]]) {
                // console.log(forCreating[allKeys1[i]], "in side matched propres value", anchor1props[allKeys1[i]])
                forCreating[allKeys1[i]] = anchor1props[allKeys1[i]]
            } else if (allKeys1[i] === 'action') {
                const comparedUrls = this._compareUrl(anchor1props[allKeys1[i]], anchor2props[allKeys1[i]]);
                forCreating[allKeys1[i]] = comparedUrls;
            } else {
                forCreating[allKeys1[i]] = '(.*?)';
            }
        }
          console.log("for creating", forCreating);
        let allProps = Object.keys(forCreating);

        let tag = '<form'
        for (let i = 0; i < allProps.length; i++) {
            //   console.log("tag at step 1", i,"---", tag);
            if(!forCreating[allProps[i]]){
                /*
                    if only property is there just keep the property without its = and its blank value
                    eg <form ...... method="post" data-prevent-resubmission=""> should be <form ...... method="post" data-prevent-resubmission>
                */
                tag += ` ${allProps[i]}`
            }else{
                tag += ` ${allProps[i]}="${forCreating[allProps[i]]}"`
            }
            
        }
        tag += '>'
        return tag;
    }
    verifyAnchorTag(fReg, matchedStrings, body1, body2) {
        let reg = fReg;
        // console.log("body-----------------------------------1--------------------------------------------------")
        // console.log(body1);
        // console.log("body-----------------------------------2--------------------------------------------------")
        // console.log(body2);
        let Reg = new RegExp(reg.replace('&amp;', '&'), 'gi')
        // console.log("hello world", Reg);
        let matched1 = matchedStrings[0];
        let matched2 = matchedStrings[1];
        //console.log("matched", matched1, matched2);
        let values1 = matched1.match(reg);
        let values2 = matched2.match(reg);
        //console.log("values", values2, values1)
        let totalMatches1 = body1.match(Reg)
        if (!totalMatches1 || totalMatches1.length == 0) {
            reg = reg.replace(/href="([^"]+)"/g, "href=$1")
            Reg = new RegExp(reg.replace('&amp;', '&'), 'gi')
            //console.log("test reg", Reg);
            totalMatches1 = body1.match(Reg)
        }
        console.log("----------------------------total Matches1 anchor----------------------------")
        console.log(totalMatches1)
        let totalMatches2 = body2.match(Reg)
        console.log("----------------------------total Matches2 Achor----------------------------")
        console.log(totalMatches2)
        //console.log("counting how many matched", totalMatches1.length, totalMatches2.length);
        const first = this.compareRegValues(totalMatches1, values1, reg.replace('&amp;', '&'));
        //console.log("first count", first);
        const second = this.compareRegValues(totalMatches2, values2, reg.replace('&amp;', '&'));
        //console.log("first count", second);

        // added 1 to compansate array indexing
        return [+first + 1, +second + 1, reg];
    }
    verifyFormTag(fReg, matchedStrings, body1, body2) {
        let reg = fReg;
        // console.log("body-----------------------------------1--------------------------------------------------")
        // console.log(body1);
        // console.log("body-----------------------------------2--------------------------------------------------")
        // console.log(body2);
        let Reg = new RegExp(reg.replace('&amp;', '&'), 'gi')
        // console.log("hello world", Reg);
        let matched1 = matchedStrings[0];
        let matched2 = matchedStrings[1];
        //console.log("matched", matched1, matched2);
        let values1 = matched1.match(reg);
        let values2 = matched2.match(reg);
        //console.log("values", values2, values1)
        let totalMatches1 = body1.match(Reg)
        if (!totalMatches1 || totalMatches1.length === 0) {
            reg = reg.replace(/action="([^"]+)"/g, "action=$1")
            Reg = new RegExp(reg.replace('&amp;', '&'), 'gi')
            //console.log("test reg", Reg);
            totalMatches1 = body1.match(Reg)
        }
        //console.log("----------------------------total Matches1----------------------------")
        // console.log(totalMatches1)
        let totalMatches2 = body2.match(Reg)
        // console.log("----------------------------total Matches2----------------------------")
        //console.log(totalMatches2)
        //console.log("counting how many matched", totalMatches1.length, totalMatches2.length);
        const first = this.compareRegValues(totalMatches1, values1, reg.replace('&amp;', '&'));
        //console.log("first count", first);
        const second = this.compareRegValues(totalMatches2, values2, reg.replace('&amp;', '&'));
        //console.log("first count", second);

        // added 1 to compansate array indexing
        return [+first + 1, +second + 1, reg];
    }
    compareRegValues(totalMatches, values, reg) {
        //console.log("values", values)
        //console.log(totalMatches.length)
        if (totalMatches) {
            for (let i = 0; i < totalMatches.length; i++) {
                let arrTemp = totalMatches[i].match(reg);
                let count = 0;
                for (let j = 1; j < arrTemp.length; j++) {
                    // console.log("get values of both arr", arrTemp[j], "--------------", values[j])
                    if (arrTemp[j] === values[j]) {
                        //console.log("get values of both arr", arrTemp[j], "--------------", values[j])
                        //console.log("occorance", i)
                        count++;
                    }
                    //console.log("coujt in loop", count)
                }
                // console.log("total count", count)
                // console.log("values length", values.length);
                if (count === values.length - 1) {
                    //console.log("reached inside true compare")
                    return i;
                }
            }
        }
        return false;

    }
}

process.on('message', async (params) => {
    const backtrack = new Backtrack(params);
    await backtrack.start();
});