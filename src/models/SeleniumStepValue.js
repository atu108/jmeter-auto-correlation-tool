import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;
const SeleniumStepValueSchema = new Schema({
  value: String,
  selenium_step:{
    type: Schema.Types.ObjectId,
    ref: "SeleniumStep"
  },
  workflow: {
    type: Schema.Types.ObjectId,
    ref: "Workflow"
  },
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
  },
  status: String
});

SeleniumStepValueSchema.plugin(MongooseError);
SeleniumStepValueSchema.plugin(findOrCreate);

export default mongoose.model('SeleniumStepValue', SeleniumStepValueSchema);