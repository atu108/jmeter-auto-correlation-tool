import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const BacktrackSchema = new Schema({
    title: String,
    runs: [{
        type: Schema.Types.ObjectId,
        ref: "Run"
    }],
    scenario:{
        type:Schema.Types.ObjectId,
        ref:"Scenario"
    },
    added_on: {
        type: Date,
        default: Date.now,
    },
    updated_on: {
        type: Date,
        default: Date.now
    },
    status: String
});

BacktrackSchema.plugin(MongooseError);
BacktrackSchema.plugin(findOrCreate);

export default mongoose.model('Backtrack', BacktrackSchema);