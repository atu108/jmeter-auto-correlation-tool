import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const MisMatchUrlSchema = new Schema({
  step:{
    type: Schema.Types.ObjectId,
    ref: "Step"
  },
    session_sequence:Number,
  session:{
    type:Schema.Types.ObjectId,
    ref:"Session"
  },
  request: {
    type: Schema.Types.ObjectId,
    ref: "Request"
  },
  url: String,
  runs: [{
    type: Schema.Types.ObjectId,
    ref: "Scenario"
  }],
  added_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now
  }
});

MisMatchUrlSchema.plugin(MongooseError);
MisMatchUrlSchema.plugin(findOrCreate);

export default mongoose.model('MisMatchUrl', MisMatchUrlSchema);
