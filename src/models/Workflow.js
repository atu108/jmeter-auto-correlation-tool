import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const WorkflowSchema = new Schema({
 name: String,
 description: String,
 file: String,
 start_url: String,
 jmx_file_name: String,
 user_load: Number,
 duration: Number,
 application: {
    type: Schema.Types.ObjectId,
    ref: "Application"
  },
  run2_value: {
    type: Schema.Types.Boolean,
    default: false
  },
  run2_request:  {
    type: Schema.Types.Boolean,
    default: false
  },
  jmx: {
    type: Schema.Types.Boolean,
    default: false
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
WorkflowSchema.plugin(MongooseError);
WorkflowSchema.plugin(findOrCreate);

export default mongoose.model('Workflow', WorkflowSchema);
