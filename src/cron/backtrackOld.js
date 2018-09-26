import 'babel-polyfill'
import mongoose from 'mongoose';
import config from '../config';
import Step from '../models/Step';
import ComparedObjects from '../models/ComparedObjects';
import Session from '../models/Session';
import {URLSearchParams , URL} from 'url';

mongoose.connect(config.database.uri, {
    useMongoClient: true,
});
mongoose.connection.on('error', console.error);
mongoose.Promise = global.Promise;

class BackTrack {

    constructor(body) {
        return this.start(body)
    }

    async start(body) {
        const temp = [];
        const comparedObjects = await ComparedObjects.find({ _id: { $in: body.compareIds } });

        const loopTimes = comparedObjects.length;

        for (let i = 0; i < loopTimes; i++) {
            const key = comparedObjects[i].key;
            const values = comparedObjects[i].values.map(value => value.replace('+', ' '));


            const stepSequenceRun1 = await Step.find({ _id: comparedObjects[i].step_ids[0] }, 'step_sequence');
            const stepSequenceRun2 = await Step.find({ _id: comparedObjects[i].step_ids[1] }, 'step_sequence');

            const map = {
                1: function () {
                    return this._searchInHeader(comparedObjects[i], key, values, [stepSequenceRun1[0].step_sequence, stepSequenceRun2[0].step_sequence])
                }.bind(this)(),
                2: function () {
                    return this._searchInCookies(comparedObjects[i], key, values, [stepSequenceRun1[0].step_sequence, stepSequenceRun2[0].step_sequence])
                }.bind(this)(),
            };

            const locationValue = comparedObjects[i].location === 'headers' ? 1 : comparedObjects[i].location === 'cookies' ? 2 : null;
            const backtrackedValue = await map[locationValue];
            temp.push(backtrackedValue || await map[3 - locationValue] ? await map[3 - locationValue] : await this._searchInBody(comparedObjects[i], key, values, [stepSequenceRun1[0].step_sequence, stepSequenceRun2[0].step_sequence]));
        }
        const data = temp.filter(obj => obj !== null);
        process.send({
            backtrack_id: body.backtrack_id,
            data,
        });
    }

    async _searchInHeader(obj, key, values, stepSequences) {
        const priority = 3;
        const found = await Step.find({
            run_id: obj.run_ids[0],
            step_sequence: { $lt: stepSequences[0] },
            'response.headers': { [key]: values[0] },
        }, [`response.headers.${key}`, 'url', 'session_id']).sort({ step_sequence: -1 });
        if (found.length < 1) return null;
        const temp = found[0];
        const file_details = await this._whichFile(temp.session_id);
        return {
            compare_id: obj._id,
            compared_url: obj.url,
            url: temp.url,
            file_run1: file_details.file,
            file_sequence_run1: file_details.sequence,
            location: 'headers',
            priority,
            matched_string: `${key}:${values[0]}`,
            reg: 'NA',
            session_id: temp.session_id,
            step_id: temp._id,
            run_ids: obj.run_ids,
            exists_in_other_run: 'NA',
            final_regex: 'NA',
        };
    }

    async _searchInCookies(obj, key, values, stepSequences) {
        const priority = 3;
        const found = await Step.find({
            run_id: obj.run_ids[0],
            step_sequence: { $lt: stepSequences[0] },
            'response.cookies': { [key]: values[0] },
        }, [`response.cookies.${key}`, 'url', 'session_id']).sort({ step_sequence: -1 });
        if (found.length < 1) return null;
        const temp = found[0];
        const file_details = await this._whichFile(temp.session_id);
        return {
            compare_id: obj._id,
            compared_url: obj.url,
            url: temp.url,
            file_run1: file_details.file,
            file_sequence_run1: file_details.sequence,
            location: 'cookies',
            priority,
            matched_string: `${key}:${values[0]}`,
            reg: 'NA',
            session_id: temp.session_id,
            step_id: temp._id,
            run_ids: obj.run_ids,
            exists_in_other_run: 'NA',
            final_regex: 'NA',
        };
    }

    async _searchInBody(obj, key, values, stepSequences) {
        const priority = 1;
        let regStr1 = '';
        let regStr2 = '';
        if (obj.location === 'url') {
            regStr1 = `<(.*?)${values[0].replace('?', '\\?')}(.*?)>`;
            regStr2 = `<(.*?)${values[1].replace('?', '\\?')}(.*?)>`;
            const reg = new RegExp(regStr1, 'i');
            const reg2 = new RegExp(regStr2, 'i');
            const matchedString = await Step.find({
                run_id: obj.run_ids[0],
                step_sequence: { $lt: stepSequences[0] },
                'response.body': reg,
            }).sort({ step_sequence: -1 });
            if (matchedString.length < 1) return null;

            const session_detail_run1 = await this._whichFile(matchedString[0].session_id);
            const matchedInOtherRun = await Step.find({
                run_id: obj.run_ids[1],
                session_sequence: session_detail_run1.sequence,
                'response.body': reg2,
            }).sort({ step_sequence: -1 });

            const r1 = new RegExp(`(.[^<]*?)${values[0].replace('?', '\\?')}(.*?)>{1}`, 'i');
            const r2 = new RegExp(`(.[^<]*?)${values[1].replace('?', '\\?')}(.*?)>{1}`, 'i');
            const matched = matchedString[0].response.body.match(r1);
            const matchedOtherRun = matchedInOtherRun.length > 0 ? matchedInOtherRun[0].response.body.match(r2) : 'NA';
            let finalReg = '';
            if (matchedOtherRun !== 'NA') {
                finalReg = this._finalReg(matched, matchedOtherRun, values, key, 'url');
            }

            const session_detail_run2 = matchedInOtherRun.length > 0 ? await this._whichFile(matchedInOtherRun[0].session_id) : await this._whichFile(false);
            return {
                compare_id: obj._id,
                compared_url: obj.url,
                key:key,
                url: matchedString[0].url,
                file_run1: session_detail_run1.file,
                file_sequence_run1: session_detail_run1.sequence,
                location: 'url found in body',
                priority,
                matched_string: finalReg.hasOwnProperty('pos1')?matched[finalReg['pos1']]:matched.join('||'),
                regCount:finalReg.hasOwnProperty('reg')?this._countReg(finalReg['reg']):'NA',
                reg: regStr1,
                session_id: matchedString[0].session_id,
                step_id: matchedString[0]._id,
                run_ids: obj.run_ids,
                url2: matchedInOtherRun[0] ? matchedInOtherRun[0].url : 'NA',
                file_run2: session_detail_run2.file,
                file_sequence_run2: session_detail_run2.sequence,
                exists_in_other_run:finalReg.hasOwnProperty('pos2')?matchedOtherRun[finalReg['pos2']]:matchedOtherRun !== 'NA'?matchedOtherRun.join('||'):'NA',
                final_regex:finalReg.hasOwnProperty('reg')?finalReg['reg']:false,
            }
        }
        key = key.split('U+FF0E').join('.');
        const regArr = [`<(.*?)${key}=${values[0]}(.*?)>`, `<(.*?)${key}(.[^<]*?)${values[0]}(.*?)>`, `<(.*?)${values[0]}(.[^<]*?)${key}(.*?)>`];
        const regArr1 = [`<(.*?)${key}=${values[1]}(.*?)>`, `<(.*?)${key}(.[^<]*?)${values[1]}(.*?)>`, `<(.*?)${values[1]}(.[^<]*?)${key}(.*?)>`];

        for (let i = 0; i < regArr.length; i++) {
            const reg = new RegExp(regArr[i], 'i');
            const reg1 = new RegExp(regArr1[i], 'i');
            const matchedString = await Step.find({
                run_id: obj.run_ids[0],
                step_sequence: { $lt: stepSequences[0] },
                'response.body': reg,
            }).sort({ step_sequence: -1 });

            if (matchedString.length < 1) continue;
            const session_detail_run1 = await this._whichFile(matchedString[0].session_id);
            const matchedInOtherRun = await Step.find({
                run_id: obj.run_ids[1],
                session_sequence: { $lte: session_detail_run1.sequence },
                'response.body': reg1
            }).sort({ step_sequence: -1 });

            const matched = matchedString[0].response.body.match(new RegExp(regArr[i].replace('<(.*?)', '(.[^<]*?)').replace('(.*?)>','(.*?)>{1}'), 'gi'));
            const matchedOtherRun = matchedInOtherRun.length > 0 ? matchedInOtherRun[0].response.body.match(new RegExp(regArr1[i].replace('<(.*?)', '(.[^<]*?)').replace('(.*?)>','(.*?)>{1}'), 'gi')) : 'NA';
            console.log(matched,"||||||||||||",matchedOtherRun);
            let finalReg = {};

            if (matchedOtherRun !== 'NA') {
                finalReg = this._finalReg(matched, matchedOtherRun, values, key, i)
            }
            const session_detail_run2 = matchedInOtherRun.length > 0 ? await this._whichFile(matchedInOtherRun[0].session_id) : await this._whichFile(false);
            return {
                compare_id: obj._id,
                compared_url: obj.url,
                key:key,
                url: matchedString[0].url,
                file_run1: session_detail_run1.file,
                file_sequence_run1: session_detail_run1.sequence,
                location: 'body',
                priority,
                matched_string: finalReg.hasOwnProperty('pos1')?matched[finalReg['pos1']]:matched.join('||'),
                regCount: finalReg.hasOwnProperty('reg')?this._countReg(finalReg['reg']):'NA',
                reg: regArr[i],
                session_id: matchedString[0].session_id,
                step_id: matchedString[0]._id,
                run_ids: obj.run_ids,
                url2: matchedInOtherRun[0] ? matchedInOtherRun[0].url : 'NA',
                file_run2: session_detail_run2.file,
                file_sequence_run2: session_detail_run2.sequence,
                exists_in_other_run: finalReg.hasOwnProperty('pos2')?matchedOtherRun[finalReg['pos2']]:matchedOtherRun !== 'NA'?matchedOtherRun.join('||'):'NA',
                final_regex: finalReg.hasOwnProperty('reg')?finalReg['reg']:false,
            };
        }
        return null;
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

    _fixBoundary(str1,str2){
        const arr1 = str1.split(' ');
        const arr2 = str2.split(' ');
        if(arr1.length < 1 || arr1.length < 1) return false;
        const obj1 = this._parseTag(arr1);
        const obj2 = this._parseTag(arr2);
        if(!obj1 || !obj2) return false;
        return this._compareObj(obj1,obj2);
    }

    _parseTag(str){
        const len1 = str.length;
        let obj={};
        // console.log(str[0]);
        obj['tag'] = str[0].slice(1,str[0].length);
        for(let i = 1; i < len1; i++){
            if(str[i].indexOf('=') === -1) return false;
            let temp = str[i].split(/=(.+)/);
            if(len1-1 === i){
                obj[temp[0]] = temp[1].slice(0, -1);
            }else{
                obj[temp[0]] = temp[1];
            }
        }
        return obj;
    }

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
}

process.on('message', (body) => {
    new BackTrack(body);
});