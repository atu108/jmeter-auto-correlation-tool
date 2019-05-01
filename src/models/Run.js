import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const RunSchema = new Schema({
  sequence: Number,
  description: String,
  workflow: {
    type: Schema.Types.ObjectId,
    ref: "Workflow"
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

RunSchema.virtual("transactions",{
  ref: "Transaction",
    localField:"_id",
    foreignField:"run",
    justOne:false
})

RunSchema.plugin(MongooseError);
RunSchema.plugin(findOrCreate);

export default mongoose.model('Run', RunSchema);