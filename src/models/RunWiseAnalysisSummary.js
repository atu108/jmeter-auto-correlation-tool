import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const RunWiseAnalysisSchema = new Schema({
    label: String,
    maxOfAllThreads: Number,
    maxVUser: Number,
    totalThroughput: Number,
    avgThroughput: Number,
    totalHits: Number,
    avgHitsPerSec: Number,
    totalPassTransaction: Number,
    totalFailTransaction: Number,
    totalError: Number,
    testType: String,
    timeStamp: String,
    applicationName: String,
    runId: Stirng,
    releaseId: String,
    added_on: {
        type: Date,
        default: Date.now,
    },
    updated_on: {
        type: Date,
        default: Date.now
    },
});

RunWiseAnalysisSchema.plugin(MongooseError);
RunWiseAnalysisSchema.plugin(findOrCreate);

export default mongoose.model('RunWiseAnalysis', RunWiseAnalysisSchema);