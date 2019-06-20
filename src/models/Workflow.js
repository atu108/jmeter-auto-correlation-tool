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
 csv_file_name: String,
 csv_required: {
   type: Boolean,
   default: false
 },
 sequence: {
  type: Number,
  default: 1
 },
 user_load: Number,
 duration: Number,
 rampup_duration: Number,
 loop_count: Number,
 application: {
    type: Schema.Types.ObjectId,
    ref: "Application"
  },
  run2_value: {
    type: Schema.Types.Boolean,
    default: false
  },
  run1_request: {
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
  jmx_data: {
    type: Schema.Types.String,
    default: "" 
  },
  jmx_pacing: {
    type: String,
    default: ''
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
// WorkflowSchema.virtual("app", {
//   ref: "Application",
//   localField: "application",
//   foreignField: "_id",
//   justOne: true
// });
export default mongoose.model('Workflow', WorkflowSchema);
