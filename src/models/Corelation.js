import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const CorelationSchema = new Schema({
  differnce: {
    type: Schema.Types.ObjectId,
    ref: "Differnce"
  },
  key: String,
  priority: String,
  url: String,
  first: {
    url: String,
    run: {
      type: Schema.Types.ObjectId,
      ref: "Run"
    }
  },
  seccond: {
    url: String,
    run: {
      type: Schema.Types.ObjectId,
      ref: "Run"
    }
  },
  matched: String,
  reg: {
    count: Number,
    regex: String
  },
  regex: String,
  scenario: {
    type: Schema.Types.ObjectId,
    ref: "Scenario"
  },
  request: {
    type: Schema.Types.ObjectId,
    ref: "Request"
  },
  compare: {
    type: Schema.Types.ObjectId,
    ref: "Compare"
  },
  har: {
    type: Schema.Types.ObjectId,
    ref: "Har"
  },
  run: {
    type: Schema.Types.ObjectId,
    ref: "run"
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

CorelationSchema.plugin(MongooseError);
CorelationSchema.plugin(findOrCreate);

export default mongoose.model('Corelation', CorelationSchema);