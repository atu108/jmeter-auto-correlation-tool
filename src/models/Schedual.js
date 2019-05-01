import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const SchedualSchema = new Schema({
  time: Date,
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

SchedualSchema.plugin(MongooseError);
SchedualSchema.plugin(findOrCreate);

export default mongoose.model('Schedual', SchedualSchema);