import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const TransactionPerSecondSchema = new Schema({
    label: String,
    maxOfAllThreads: Number,
    countOfLabel: Number,
    hostName: String,
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

TransactionPerSecondSchema.plugin(MongooseError);
TransactionPerSecondSchema.plugin(findOrCreate);

export default mongoose.model('TransactionPerSecond', TransactionPerSecondSchema);