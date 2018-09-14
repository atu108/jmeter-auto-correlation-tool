import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const RunSchema = new Schema({
  title: String,
  description: String,
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
  },
  status: String,
}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

RunSchema.virtual("values", {
  ref: "RunValue",
  localField: "_id",
  foreignField: "run",
  justOne: false
});

RunSchema.plugin(MongooseError);
RunSchema.plugin(findOrCreate);

export default mongoose.model('Run', RunSchema);