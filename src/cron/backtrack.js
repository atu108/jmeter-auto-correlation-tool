import mongoose from 'mongoose';
import config from '../config';
import logger from '../utility/logger';

import Compare from '../models/Compare';
import Difference from '../models/Difference';
import Request from '../models/Request';
import Step from "../models/Step";
import Session from "../models/Session";
import Correlation from "../models/Correlation";
import RunController from '../controllers/RunController';
const cheerio = require("cheerio");


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
        const diffs = await Difference.find({scenario:this.params}).populate('first.request',['sequence']).populate('second.request',['sequence']).populate('session');
        console.log("inside backtrack", diffs);
        const loopTimes = diffs.length;
        for(let i = 0; i < loopTimes; i++){
            console.log(i);
            if(diffs[i].duplicate !== ''){
                continue;
            }
            let correlation = await this.searchInBodyNew(diffs[i]);
            if(correlation){
                console.log("found one",correlation);
                this.correlations.push(correlation);
            }
        }
        process.send({
            correlations:this.correlations
          });
    }

    async _searchInBody(diff){
        if(diff.location === 'url'){
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
        const regArr = [`<(.*?)${key}=${(value1).replace('+',' ')}(.*?)>`, `<(.*?)${key}(.[^<]*?)${value1.replace('+',' ')}(.*?)>`, `<(.*?)${value1.replace('+',' ')}(.[^<]*?)${key}(.*?)>`];
        const regArr1 = [`<(.*?)${key}=${value2.replace('+',' ')}(.*?)>`, `<(.*?)${key}(.[^<]*?)${value2.replace('+',' ')}(.*?)>`, `<(.*?)${value2.replace('+',' ')}(.[^<]*?)${key}(.*?)>`];

        for (let i = 0; i < regArr.length; i++) {
            const reg = new RegExp(regArr[i], 'i');
            const reg1 = new RegExp(regArr1[i], 'i');
            //console.log("step sequence here", stepSeq);
            const matched1 = await Request.find({
                run: runs[0],
                sequence: { $lt: stepSeq[0] },
                'response.body': reg,
            }).sort({ step_sequence: -1 }).populate('session');
            //console.log(matched1);
            if (matched1.length < 1) continue;

            //added url check in run2
            const matched2 = await Request.find({
                run: runs[1],
                url:matched1[0].url,
                session_sequence: matched1[0].session_sequence,
                'response.body': reg1
            }).sort({ step_sequence: -1 }).populate('session');
            const matched = matched1[0].response.body.match(new RegExp(regArr[i].replace('<(.*?)', '(.[^<]*?)').replace('(.*?)>','(.*?)>{1}'), 'gi'));
            const matchedOtherRun = matched2.length > 0 ? matched2[0].response.body.match(new RegExp(regArr1[i].replace('<(.*?)', '(.[^<]*?)').replace('(.*?)>','(.*?)>{1}'), 'gi')) : 'NA';

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
                reg_count: finalReg.hasOwnProperty('reg')?this._countReg(finalReg['reg']):'NA',
                optimal_reg_number: '',
                reg: regArr[i],
                final_regex: finalReg.hasOwnProperty('reg')?finalReg['reg']:false,
                first: {
                    url: matched1[0].url,
                    matched: finalReg.hasOwnProperty('pos1')?matched[finalReg['pos1']]:matched.join('||'),
                    session_title: matched1[0].session.title,
                    session_sequence:  matched1[0].session.sequence,
                    request:matched1[0]._id,
                    run: matched1[0].run

                },
                second: {
                    url: matched2[0] ? matched2[0].url : 'NA',
                    matched: finalReg.hasOwnProperty('pos2')?matchedOtherRun[finalReg['pos2']]:matchedOtherRun !== 'NA'?matchedOtherRun.join('||'):'NA',
                    session_title: matched2[0].session.title,
                    session_sequence:  matched2[0].session.sequence,
                    request:matched2[0]._id,
                    run: matched2[0].run

                },
                scenario:diff.scenario
            }

        }

        return false;
    }

    _countReg(str){
        let regcount = '';
        const count =  str.split('(.*?)').length;
        for(let i = 1; i < count; i++){
            regcount += `$${i}$`;
        }
        return regcount;
    }

    _finalReg(matched, matchedOtherRun, values, key, caseNo) {
        if(caseNo === "url"){
            if (matched[0].replace(values[0], '') === matchedOtherRun[0].replace(values[1], '')) {
                return {
                    reg: matched[0].replace(values[0], '(.*?)'),
                    pos1: 0,
                    pos2: 0
                };
            }else{
                return false;
            }
        }
        const length1 = matched.length;
        const length2 = matchedOtherRun.length;
        const temp = length1 - length2;
        let i;
        let j;
        if(temp === 0){
            for(i = 0; i < length1; i++){
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
                reg: `${this._fixBoundary(matched[0],matchedOtherRun[0]) !== false ?this._fixBoundary(matched[0],matchedOtherRun[0])+'>':false}`,
                pos1: 0,
                pos2: 0
            };
        }
        if(temp < 0){
            for(i = 0; i < length2; i++){
                for(j = 0; j < length1; j++){
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
                reg: `${this._fixBoundary(matched[0],matchedOtherRun[0]) !== false ?this._fixBoundary(matched[0],matchedOtherRun[0])+'>':false}`,
                pos1: 0,
                pos2: 0
            };
        }
        if(temp > 0){
            for(i = 0; i < length1; i++){
                for(j = 0; j < length2; j++){
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
                reg: `${this._fixBoundary(matched[0],matchedOtherRun[0]) !== false ?this._fixBoundary(matched[0],matchedOtherRun[0])+'>':false}`,
                pos1: 0,
                pos2: 0
            };
        }
        return false;
    }

    _fixBoundary(str1,str2,values){
        let temp = [str1.replace(values[0],'(*?)'),str2.replace(values[1],'(*?)')]
        if(temp[0] === temp[1])
        return temp[0];
        // console.log("strings ", str1, str2)
        const arr1 = temp[0].split(' ');
        const arr2 = temp[1].split(' ');
        // console.log("both arrys", arr1, arr2);
        if(arr1.length < 1 || arr1.length < 1) return false;
        const obj1 = this._parseTag(arr1);
        // console.log("object parsed 1 ",obj1)
        const obj2 = this._parseTag(arr2);
        // console.log("object parsed 2 ",obj2)
        // console.log(obj2)
        if(!obj1 || !obj2) return false;
        return this._compareObj(obj1,obj2);
    }
//this is to compare tag by tab rather than characters while trying to find the final regex
    _parseTag(str){
        console.log("in parse tag", str);
        const len1 = str.length;
        let obj={};
        // console.log(str[0]);
        obj['tag'] = str[0].slice(1,str[0].length);
        for(let i = 1; i < len1; i++){
            if(str[i].indexOf('=') === -1) return false;
            // console.log("reached inside")
            let temp = str[i].split(/=(.+)/);
            if(len1-1 === i){
                obj[temp[0]] = temp[1].slice(0, -1);
            }else{
                obj[temp[0]] = temp[1];
            }
        }
        return obj;
    }
//comapres the different components of a tag whether two tags are equal if not make them same by replacing non matching words or components
    _compareObj(obj1,obj2){
        let str = '';
        for(let x in obj1){
            //checking the property in other obj
            if(obj2.hasOwnProperty(x)){

                //check if the value is url
                if(this._isURL(obj1[x])){
                    str = `${str} ${x}=${this._compareUrl(obj1[x],obj2[x])}`
                }else{
                    //check if value is tag
                    if(x === 'tag'){
                        //check if both tags are same
                        if(obj1[x] === obj2[x]){
                            //modify str
                            str = `${str}<${obj1[x]}`;
                        }else{
                            str = `${str}<(.*?)`
                        }

                    }else{
                        if(obj1[x] === obj2[x]){
                            str = `${str} ${x}=${obj1[x]}`
                        }else{
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
    _compareUrl(url1,url2){
        const loc1 = new URL(url1);
        const loc2 = new URL(url2);
        let params1 = loc1.searchParams;
        let params2 = loc2.searchParams;
        for (const [name, value] of params1) {
            if(params2.has(name)){
                if(params2.get(name) !== value){
                    loc1.searchParams.set(name, '(.*?)')
                }
            }

        }
        return decodeURIComponent(loc1.href);
    }
// check if a string url
    _isURL(str) {
        let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name and extension
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?'+ // port
            '(\\/[-a-z\\d%@_.~+&:]*)*'+ // path
            '(\\?[;&a-z\\d%@_.,~+&:=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

        return pattern.test(str);
    }


    async _whichFile(id) {
        if (id === false) {
            return {
                file: 'Not Found',
                sequence: 'Not Found',
            }
        }
        const session = await Session.find({ _id: id });
        return {
            file: session[0].title,
            sequence: session[0].sequence,
        }
    }

    async searchInBodyNew(diff){
        let key = diff.key.split('U+FF0E').join('.');
        let value1 = diff.first.value.replace('+', ' ');
        let value2 = diff.second.value.replace('+', ' ');
        let finalReg = '';
        let stepSeq = [diff.first.request.sequence, diff.second.request.sequence];
        // console.log("inside new serach", key, "--", value1, "--",value2);

        let runs = [diff.first.run, diff.second.run];
        const allRequests = await Request.find({run:runs[0],sequence:{$lt:stepSeq[0]}}).sort({ step_sequence: -1 });
        for(let i = 0; i < allRequests.length; i++){
            let body = allRequests[i].response.body;
            if(body === undefined || !body || body == ''){
               continue;
            }
            // if(diff.location === 'url'){
            //     return this._findAchorTag(body,key,value,allRequests[i]);
            // }
            
            let tags = {}
            tags.value = this.findInput(body, key, value1);
            tags.type = 1
            if(!tags.value){
               tags.value = this.findSelect(body, key, value1);
               tags.type = 2
            }

            if(tags.value && tags.value.length > 0){
                let second = await Request.find({run:runs[1],url:allRequests[i].url, session_sequence:allRequests[i].session_sequence, 'request.method':allRequests[i].request.method});
                let sencondTags = [];
                    if(tags.type === 1){
                        sencondTags = this.findInput(second[0].response.body, key , value2)
                    }else{
                        sencondTags = this.findSelect(second[0].response.body, key , value2)
                    }
               
                if(sencondTags.length > 0){
                    let forFinalReg = this.checkExactMatch(tags.value, sencondTags);
                    if(!forFinalReg){
                        forFinalReg = this.checkLooseMatch(tags.value, sencondTags);
                    }
                    if(forFinalReg){
                        //removed empty space with + in cheerio returned object
                        forFinalReg[0].attribs.value = forFinalReg[0].attribs.value.replace(" ", '+');
                        forFinalReg[1].attribs.value = forFinalReg[1].attribs.value.replace(" ", '+');
                        finalReg = this._fixBoundary(cheerio.html(forFinalReg[0]), cheerio.html(forFinalReg[1]), [value1, value2]);
                        const reg_name = this._getRegName(finalReg,cheerio.html(forFinalReg[0]),value1,key)
                        return {
                            key: key,
                            priority: 1,
                            compared_url: diff.url,
                            location: diff.location,
                            reg_count: this._countReg(finalReg+'>'),
                            reg_name: reg_name,
                            final_regex: finalReg+'>',
                            first: {
                                url: allRequests[i].url,
                                matched: cheerio.html(forFinalReg[0]),
                                session_title: allRequests[i].session.title,
                                session_sequence:  allRequests[i].session.sequence,
                                request:allRequests[i]._id,
                                run: allRequests[i].run
                
                            },
                            second: {
                                url: second[0].url,
                                matched: cheerio.html(forFinalReg[1]),
                                session_title: second[0].session.title,
                                session_sequence:  second[0].session.sequence,
                                request: second[0]._id,
                                run: second[0].run
                
                            },
                            scenario:diff.scenario,
                            difference:diff._id
                        }
                    }
                }
            }
        }
        return false;
    }



    checkExactMatch(tag, tag2){
        //console.log("input check match")
        for(let i = 0; i < tag.length; i++){
            const index = tag2.findIndex( tg => tag[i].type === tg.type &&
                    tag[i].name === tg.name &&
                    tag[i].parent.type === tg.parent.type &&
                    tag[i].parent.name === tg.parent.name &&
                    ((tag[i].next.type === tg.next.type && tag[i].next.type === 'tag' && tag[i].next.name === tg.next.name) 
                    || (tag[i].next.type === tg.next.type && tag[i].next.type === 'text' && tag[i].next.body === tg.next.body)) &&
                    ((tag[i].prev.type === tg.prev.type && tag[i].prev.type === 'tag' && tag[i].prev.name === tg.prev.name) 
                    || (tag[i].prev.type === tg.prev.type && tag[i].prev.type === 'text' && tag[i].prev.body === tg.prev.body))
                ) 
            if(index !== -1){
                return [tag[i], tag2[index]];
            }
        }
        return false;
    }

    checkLooseMatch(tag, tag2){
        for(let i = 0; i < tag.length; i++){
            const index = tag2.findIndex( tg => tag[i].type === tg.type &&
                    tag[i].name === tg.name &&
                    tag[i].parent.type === tg.parent.type &&
                    tag[i].parent.name === tg.parent.name
                ) 
            if(index !== -1){
                return [tag[i], tag2[index]];
            }
        }
        return false;
    }
    
    findInput(body, key, value){
        try{
            let $ = cheerio.load(body.replace((/\\/g, "")));
            let inputs = $('input[name="'+ key +'"][value="'+ value +'"]').toArray();
        // console.log("inputs check", typeof inputs, "all inouts", inputs[0]);
        if(inputs.length > 0){
            return inputs;
            // return inputs;
        }else{
            return false;
        }
        }catch(e){
            console.log(e);
        }
        
        
    }

    findSelect(body, key, value){
        let $ = cheerio.load(body.replace((/\\/g, "")));
        let selects = $('select[name="'+ key +'"] option[value="' + value + '"]').toArray;
        if(selects.length > 0){
            return selects;
        }else{
            return false;
        }
    }

    _getRegName(final,matched,value,key){
    let resultArr = matched.match(new RegExp(final+">"))
    for(let i = 1; i < resultArr.length; i++){
        if(resultArr[i].replace(/"/g, '').replace(/'/g,'') === value){
            return key+"_COR_g"+i;
        }else{
            console.log(resultArr[i].replace('"', '',g))
        }
    }
    
    }

    // _findAchorTag(body,value1,value2, request){
    //     try{
    //         let $ = cheerio.load(body.replace((/\\/g, "")));
    //         let anchor1 = $('a[href="'+value1+'"]').toArray();
    //     // console.log("inputs check", typeof inputs, "all inouts", inputs[0]);
    //     if(anchor1.length > 0){
    //         let anchor2 = $('a[href="'+value2+'"]').toArray();
    //         if(anchor2.length > 0){
    //             let forFinalReg = this.checkExactMatch(anchor1, anchor2)
    //             if(!forFinalReg){
    //                 forFinalReg = this.checkLooseMatch(anchor1, anchor2);
    //             }
    //             if(forFinalReg){
    //                 finalReg = this._fixBoundary(cheerio.html(forFinalReg[0]), cheerio.html(forFinalReg[1]), [value1, value2]);
    //                 //const reg_name = this._getRegName(finalReg,cheerio.html(forFinalReg[0]),value1)
    //                 const reg_name = "pending"
    //                 return {
    //                     key: key,
    //                     priority: 1,
    //                     compared_url: diff.url,
    //                     location: diff.location,
    //                     reg_count: this._countReg(finalReg+'>'),
    //                     reg_name: reg_name,
    //                     final_regex: finalReg+'>',
    //                     first: {
    //                         url: request.url,
    //                         matched: cheerio.html(forFinalReg[0]),
    //                         session_title: request.session.title,
    //                         session_sequence:  request.session.sequence,
    //                         request:request._id,
    //                         run: request.run
            
    //                     },
    //                     second: {
    //                         url: second[0].url,
    //                         matched: cheerio.html(forFinalReg[1]),
    //                         session_title: second[0].session.title,
    //                         session_sequence:  second[0].session.sequence,
    //                         request: second[0]._id,
    //                         run: second[0].run
            
    //                     },
    //                     scenario:diff.scenario,
    //                     difference:diff._id
    //                 }
    //             }
    //         }
          
    //     }else{
    //         return false;
    //     }
    //     }catch(e){
    //         console.log(e);
    //     }
    // }
}

process.on('message', async (params) => {
    const backtrack = new Backtrack(params);
    await backtrack.start();
});