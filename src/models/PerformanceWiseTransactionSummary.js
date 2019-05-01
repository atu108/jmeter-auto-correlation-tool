import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const PerformanceWiseTransactionSummarySchema = new Schema({
    label: String,
    maxOfAllThreads: Number,
    passCount: Number,
    failCount: Number,
    minOfElapsed: Number,
    avgOfElapsed: Number,
    maxOfElapsed: Number,
    stdOfElapsed: Number,
    timeStamp: String,
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

PerformanceWiseTransactionSummarySchema.plugin(MongooseError);
PerformanceWiseTransactionSummarySchema.plugin(findOrCreate);

export default mongoose.model('PerformanceWiseTransactionSummary', PerformanceWiseTransactionSummarySchema);