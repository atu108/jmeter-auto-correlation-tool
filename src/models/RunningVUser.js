import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const RunningVUserSchema = new Schema({
    label: String,
    maxOfAllThreads: Number,
    success: String,
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

RunningVUserSchema.plugin(MongooseError);
RunningVUserSchema.plugin(findOrCreate);

export default mongoose.model('RunningVUser', RunningVUserSchema);