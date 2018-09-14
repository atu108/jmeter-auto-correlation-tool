import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const StepSchema = new Schema({
  target: String,
  command: String,
  value: {
    type: String,
    default: null
  },
  sequence: Number,
  scenario: {
    type: Schema.Types.ObjectId,
    ref: "Scenario"
  },
  recording: {
    type: Schema.Types.ObjectId,
    ref: "Recording"
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

StepSchema.plugin(MongooseError);
StepSchema.plugin(findOrCreate);

export default mongoose.model('Step', StepSchema);