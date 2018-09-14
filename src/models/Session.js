import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';
import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;
const SessionSchema = new Schema({
  title: String,
  sequence: Number,
  added_on: {
    type: Date,
    default: Date.now()
  },
  updated_on:{
    type:Date,
    default: Date.now()
  },
  project_id: {type: Schema.Types.ObjectId, ref: 'Project'},
  scenario_id: {type: Schema.Types.ObjectId, ref: 'Scenario'},
  run_id: {type: Schema.Types.ObjectId, ref: 'Run'}
});

SessionSchema.plugin(MongooseError);
SessionSchema.plugin(findOrCreate);
export default mongoose.model('Session', SessionSchema);
