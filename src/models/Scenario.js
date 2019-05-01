import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const ScenarioSchema = new Schema({
  max_user_load: Number,
  description: String,
  test_type: String,
  application: {
    type: Schema.Types.ObjectId,
    ref: "Application"
  },
  workflows:[{
    type: Schema.Types.ObjectId
  }],
  build_number: Number,
  time_zone: String,
  start_time: Date,
  environment_availibility: Number,
  test_duration: Number,
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