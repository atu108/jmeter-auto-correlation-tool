import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const HitsPerSecSchema = new Schema({
    label: String,
    hostName: String,
    passCount: String,
    failCount: String,
    minOfElapsed: String,
    maxOfElapsed: String,
    avgOfElapsed: String,
    stdOfElapsed: String,
    timeStamp: String,
    maxOfAllThread: String,
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

HitsPerSecSchema.plugin(MongooseError);
HitsPerSecSchema.plugin(findOrCreate);

export default mongoose.model('HitsPerSec', HitsPerSecSchema);