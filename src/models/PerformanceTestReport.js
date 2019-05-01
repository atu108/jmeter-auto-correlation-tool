import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const PerformanceTestReportSchema = new Schema({
    timeStamp: String,
    elapsed:{
        type: Number
    },
    label: String,
    responseCode: Number, 
    threadName: String,
    dataType: String, 
    success: String,
    failureMessage: String,
    bytes: Number,
    sentBytes: Number,
    grpThreads: Number,
    allThreads: Number,
    URL: String,
    Filename: String,
    Latency: Number,
    Encoding: String,
    SampleCount: Number,
    ErrorCount: Number,
    IdleTime: Number,
    Connect: Number,
    added_on: {
        type: Date,
        default: Date.now,
    },
    updated_on: {
        type: Date,
        default: Date.now
    }
});

PerformanceTestReportSchema.plugin(MongooseError);
PerformanceTestReportSchema.plugin(findOrCreate);

export default mongoose.model('PerformanceTestReport', PerformanceTestReportSchema);
