import mongoose from 'mongoose';
import config from '../config';
import logger from '../utility/logger';

import Compare from '../models/Compare';
import Difference from '../models/Difference';
import Request from '../models/Request';


class Compare {

    constructor(params) {
        this.params = params;
        this.runs = params.runs;
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
        console.log("here");

        process.send({
            mismatchUrls:this.mismatchedUrls,
            comparissions:this.comparissions,
            compare:this.params
        });
    }

}

process.on('message', async (params) => {
    const compare = new Compare(params);
    await compare.start();
});
