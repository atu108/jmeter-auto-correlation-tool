import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const RunValueSchema = new Schema({
  target: String,
  value: String,
  sequence: Number,
  run: {
    type: Schema.Types.ObjectId,
    ref: "Run"
  },
  step: {
    type: Schema.Types.ObjectId,
    ref: "Step"
  },
  scenario: {
    type: Schema.Types.ObjectId,
    ref: "Scenario"
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

RunValueSchema.plugin(MongooseError);
RunValueSchema.plugin(findOrCreate);

export default mongoose.model('RunValue', RunValueSchema);