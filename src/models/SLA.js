import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const SLASchema = new Schema({
    response_time: Number,
    error: Number,
    cpu_utlitisation: Number,
    memory_usage: Number,
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
      }
});

ContactSchema.plugin(MongooseError);
ContactSchema.plugin(findOrCreate);

export default mongoose.model('SLA', SLASchema);