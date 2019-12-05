import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  first_name: String,
  last_name: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  company_name: {
    type: String,
    required: true
  },
  password: String,
  added_on: {
    type: Date,
    default: Date.now,
  },
  phone: Number,
  country: String,
  country_code: String,
  state: String,
  type: {
    type: String,
    deafult: "temp"
  },
  updated_on: {
    type: Date,
    default: Date.now
  },
  status: Boolean
});

UserSchema.plugin(MongooseError);
UserSchema.plugin(findOrCreate);

export default mongoose.model('User', UserSchema);
