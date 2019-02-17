import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const ContactSchema = new Schema({
  name: String,
  message: String,
  type:String,
  app: String,
  subject: String,
  msg_type:String, 
  file: String,
  added_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now
  },
});

ContactSchema.plugin(MongooseError);
ContactSchema.plugin(findOrCreate);

export default mongoose.model('Contact', ContactSchema);