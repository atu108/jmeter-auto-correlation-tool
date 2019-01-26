import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const ScenarioSchema = new Schema({
  name: String,
  description: String,
  start_url: String,
  jmx_file_name: String,
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project"
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

ScenarioSchema.plugin(MongooseError);
ScenarioSchema.plugin(findOrCreate);

export default mongoose.model('Scenario', ScenarioSchema);