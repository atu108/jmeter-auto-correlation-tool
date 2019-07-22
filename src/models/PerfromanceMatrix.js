import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const PerformanceMatrixSchema = new Schema({
    transaction_name: String,
    matrix: String,
    workflow: {
        type: Schema.Types.ObjectId,
        ref: "Workflow"
    },
    sequence: Number,
    application: {
        type: Schema.Types.ObjectId,
        ref: "Apllication"
    },
    added_on: {
        type: Date,
        default: Date.now,
    },
    updated_on: {
        type: Date,
        default: Date.now
    }
});

PerformanceMatrixSchema.plugin(MongooseError);
PerformanceMatrixSchema.plugin(findOrCreate);

export default mongoose.model('PerformanceMatrix', PerformanceMatrixSchema);
