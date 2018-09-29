import mongoose from 'mongoose';
import config from '../config';
import logger from '../utility/logger';

import Compare from '../models/Compare';
import Difference from '../models/Difference';
import Request from '../models/Request';
import Step from "../models/Step";


class backtrack {

    constructor(params) {
        // this.params = params;
        // this.runs = params.runs;
        // this.correlations = [];
        // this.current = 0;
        this.connect();
        return{
            start:this.start.bind(this)
        }
    }

    connect() {
        mongoose.connect(config.database.uri, {
            useMongoClient: true
        });
        mongoose.connection.on('error', logger.error);
        mongoose.Promise = global.Promise;
    }

    async start() {
        const diffs = await Difference.find({scenario:'5b9e004a3bdf8033cfe20edb'}).populate('first.request',['sequence']).populate('second.request',['sequence']);
        // console.log(diffs[0].first.request);
        // console.log(diffs[0].second.request);
        const loopTimes = diffs.length;
        console.log("kitni baar chalega",loopTimes);
        for(let i = 0; i < loopTimes.length; i++){
            await this._searchInBody(diffs[i]);
        }

        // process.send({
        //     mismatchUrls:this.mismatchedUrls,
        //     comparissions:this.comparissions,
        //     compare:this.params
        // });
    }

    async _searchInBody(diff){
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
        let value1 = diff.first.value;
        let value2 = diff.second.value;
        let stepSeq = [diff.first.request.sequence, diff.second.request.sequence];
        console.log("step sequences", stepSeq);
        let runs = [diff.first.run, diff.second.run];
        const regArr = [`<(.*?)${key}=${value1}(.*?)>`, `<(.*?)${key}(.[^<]*?)${value1}(.*?)>`, `<(.*?)${value1}(.[^<]*?)${key}(.*?)>`];
        const regArr1 = [`<(.*?)${key}=${value2}(.*?)>`, `<(.*?)${key}(.[^<]*?)${value2}(.*?)>`, `<(.*?)${value2}(.[^<]*?)${key}(.*?)>`];

        for (let i = 0; i < regArr.length; i++) {
            const reg = new RegExp(regArr[i], 'i');
            const reg1 = new RegExp(regArr1[i], 'i');
            const matched1 = await Request.find({
                run: runs[0],
                sequence: { $lt: stepSeq[0] },
                'response.body': reg,
            }).sort({ step_sequence: -1 });
            if (matched1.length < 1) continue;
            console.log("first match in run 1",matched1);
            //added url check in run2
            const matched2 = await Request.find({
                run: runs[1],
                url: matched1[0].url,
                session_sequence: matched1[0].session_sequence,
                'response.body': reg1
            }).sort({ step_sequence: -1 });
            console.log("first match in run 2",matched2);
        }



    }

    manageMultipleUrl(){

    }

    finalReg(){

    }

    fixBoundary(){

    }


    // to do
    // async _searchInHeader(obj, key, values, stepSequences) {
    //     const priority = 3;
    //     const found = await Step.find({
    //         run_id: obj.run_ids[0],
    //         step_sequence: { $lt: stepSequences[0] },
    //         'response.headers': { [key]: values[0] },
    //     }, [`response.headers.${key}`, 'url', 'session_id']).sort({ step_sequence: -1 });
    //     if (found.length < 1) return null;
    //     const temp = found[0];
    //     const file_details = await this._whichFile(temp.session_id);

        // reg in header e.g keep-Alive:(.+?)\n

        // return {
        //     key:key,
        //     priority:3,
        //     compared_url:obj.url,
        //     location:obj.location,
        //     reg_count:'Na',
        //     optimal_reg_number:'Na',
        //     reg: 'Na',
        //     final_regex:'Na',
        //     first: {
        //         url:,
        //         matched:,
        //         session_title:,
        //         session_sequence:,
        //         request:,
        //         run:
        //     },
        //     second: {
        //         url:,
        //         matched:,
        //         session_title:,
        //         session_sequence:,
        //         request:,
        //         run:
        //
        //     },
        //     backtrack_id:{ type: Schema.Types.ObjectId, ref: 'Backtrack' },
        //     session_id: { type: Schema.Types.ObjectId, ref: 'Session' },
        //     compare_id: { type: Schema.Types.ObjectId, ref: 'Compare' },
        // };

}

// process.on('message', async (params) => {
//     const compare = new Compare(params);
//     await compare.start();
// });

export default new backtrack();