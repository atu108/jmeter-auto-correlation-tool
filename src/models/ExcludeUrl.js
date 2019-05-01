import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const ExcludeUrlSchema = new Schema({
  url:{
    type:String,
    unique: true
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

ExcludeUrlSchema.plugin(MongooseError);
ExcludeUrlSchema.plugin(findOrCreate);

export default mongoose.model('ExcludeUrl', ExcludeUrlSchema);