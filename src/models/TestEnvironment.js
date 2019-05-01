import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const TestEnvironmentSchema = new Schema({
  os: String,
  webserver: String,
  appserver: Boolean,
  dbserver: Boolean,
  protocol: String,
  technology: String,
  type: String,
  tier: String,
  db_volume: Number,
  integrations: String,
  application: {
    type: Schema.Types.ObjectId,
    ref: "Application"
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

TestEnvironmentSchema.plugin(MongooseError);
TestEnvironmentSchema.plugin(findOrCreate);

export default mongoose.model('TestEnvironment', TestEnvironmentSchema);
