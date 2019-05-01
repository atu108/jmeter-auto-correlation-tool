import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const TestSchema = new Schema({
  name: String,
  application: {
    type: Schema.Types.ObjectId,
    ref: "Application"
  },
  schedual: {
    type: Schema.Types.ObjectId,
    ref: "Schedual"
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

TestSchema.plugin(MongooseError);
TestSchema.plugin(findOrCreate);

export default mongoose.model('Test', TestSchema);