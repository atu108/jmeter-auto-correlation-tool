import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  title: String,
  description: String,
  url: String,
  screenshot: String,
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  added_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now
  },
  status: Boolean
});

ProjectSchema.plugin(MongooseError);
ProjectSchema.plugin(findOrCreate);

export default mongoose.model('Project', ProjectSchema);
