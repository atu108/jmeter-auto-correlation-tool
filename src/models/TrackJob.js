import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;
// this model is for keeping track of the selenium job which are not finished
// priority:-> 0 => normal , 1 => high, -1 => low
const TrackJobSchema = new Schema({
    savedSteps: String,
    steps: String,
    start_url: String,
    filename: String,
    saveDropdown: Boolean,
    generateJmx: {
        type: Boolean,
        default: false
    },
    retries:{
        type: Number,
        default: 0
    },
    status:{
        type: String,
        default: "pending"
    },
    priority: {
        type: Number,
        default: 1
    },
    run:{
        type: Schema.Types.ObjectId,
        ref: "Run"
    },
    workflow:{
        type: Schema.Types.ObjectId,
        ref: "Workflow"
    },
    application: {
        type: Schema.Types.ObjectId,
        ref: "Application"
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

TrackJobSchema.plugin(MongooseError);
TrackJobSchema.plugin(findOrCreate);

export default mongoose.model('TrackJob', TrackJobSchema);