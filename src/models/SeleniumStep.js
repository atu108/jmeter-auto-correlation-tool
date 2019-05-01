import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;
const SeleniumStepSchema = new Schema({
  target: String,
  command: String,
  comment: String,
  value: {
    type: String,
    default: null
  },
  targets:[[]],
  sequence: Number,
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
  status: String,
  },{
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  });

SeleniumStepSchema.plugin(MongooseError);
SeleniumStepSchema.plugin(findOrCreate);

SeleniumStepSchema.virtual("options", {
  ref: "Dropdown",
  localField: "_id",
  foreignField: "selenium_step",
  justOne: true
});
SeleniumStepSchema.virtual("run2value", {
  ref: "SeleniumStepValue",
  localField: "_id",
  foreignField: "selenium_step",
  justOne: true
});
export default mongoose.model('SeleniumStep', SeleniumStepSchema);