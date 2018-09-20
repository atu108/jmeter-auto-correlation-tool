import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const DifferenceSchema = new Schema({
  url: String,
  sequence: Number,
  location: String,
  key: String,
  session_sequence:Number,
  first: {
    value: String,
    request: {
      type: Schema.Types.ObjectId,
      ref: "Request"
    },
    run: {
      type: Schema.Types.ObjectId,
      ref: "Run"
    }
  },
  second:{
    value: String,
    request: {
      type: Schema.Types.ObjectId,
      ref: "Request"
    },
    run: {
      type: Schema.Types.ObjectId,
      ref: "Run"
    }
  },
  step:{
    type: Schema.Types.ObjectId,
    ref: "Step"
  },
  session:{
    type:Schema.Types.ObjectId,
    ref:"Session"
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

DifferenceSchema.plugin(MongooseError);
DifferenceSchema.plugin(findOrCreate);

export default mongoose.model('Difference', DifferenceSchema);
