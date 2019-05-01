import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const WorkflowDetailSchema = new Schema({
 description: String,
 file: String,
 application: {
    type: Schema.Types.ObjectId,
    ref: "Application"
  },
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
  status: String
});

WorkflowDetailSchema.plugin(MongooseError);
WorkflowDetailSchema.plugin(findOrCreate);

export default mongoose.model('WorkflowDetail', WorkflowDetailSchema);
