import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const RequestSchema = new Schema({
  url: String,
  sequence: Number,
  session_sequence: Number,
  request: {
    method: String,
    url: String,
    params: [],
    post_data: [],
    headers: [],
    cookies: []
  },
  response: {
    status: Number,
    body: String,
    headers: [],
    cookies: []
  },
  run: {
    type: Schema.Types.ObjectId,
    ref: "Run"
  },
  step: {
    type: Schema.Types.ObjectId,
    ref: "Step"
  },
  session:{
    type:Schema.Types.ObjectId,
    ref:"Session"
  },
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
  }
});

RequestSchema.plugin(MongooseError);
RequestSchema.plugin(findOrCreate);
RequestSchema.index({ run: 1, sequence: 1}, { unique: true });
export default mongoose.model('Request', RequestSchema);
