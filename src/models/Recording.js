import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const RecordingSchema = new Schema({
  start_url: String,
  sequence_count: Number,
  scenario: {
    type: Schema.Types.ObjectId,
    ref: "Scenario"
  },
  ua: String,
  added_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now
  }
});

RecordingSchema.plugin(MongooseError);
RecordingSchema.plugin(findOrCreate);

export default mongoose.model('Recording', RecordingSchema);