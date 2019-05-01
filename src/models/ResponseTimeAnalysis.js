import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const ResponseTimeAnalysisSchema = new Schema({
    label: String,
    allThreads: String,
    hostName: String,
    avgOfElapsed: String,
    testType : String,
    timeStamp: String,
    applicationName: String,
    runId: String,
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

ResponseTimeAnalysisSchema.plugin(MongooseError);
ResponseTimeAnalysisSchema.plugin(findOrCreate);

export default mongoose.model('ResponseTimeAnalysis', ResponseTimeAnalysisSchema);
        