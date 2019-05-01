import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const ErrorPerSecSchema = new Schema({
    timeStamp: Date,
    responseMessage: String,
    countOfResponseMessage: String,
    label: String,
    allThreads: String,
    hostname: String,
    testType: String,
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

ErrorPerSecSchema.plugin(MongooseError);
ErrorPerSecSchema.plugin(findOrCreate);

export default mongoose.model('ErrorPerSec', ErrorPerSecSchema);