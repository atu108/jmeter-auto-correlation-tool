import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const ApplicationSchema = new Schema({
  name: String,
  type: String,
  version: Number,
  is_captcha: Boolean, //captcha in application
  is_encrypted: Boolean, // enctrption in application
  is_auth: Boolean, //authentication in application
  auth_type: String, // type of authentication in application
  description: String,
  url: String,
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  added_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now
  },
  status: {
    type: Schema.Types.String,
    default: "Pending"
  },
  jmx: {
    type: Schema.Types.String,
    default: "pending"
  }
}, {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  });

ApplicationSchema.virtual("workflow", {
  ref: "Workflow",
  localField: "_id",
  foreignField: "application",
  justOne: false
});
ApplicationSchema.virtual("test", {
  ref: "Test",
  localField: "_id",
  foreignField: "application",
  justOne: false
});
ApplicationSchema.virtual("schedual", {
  ref: "Schedual",
  localField: "_id",
  foreignField: "application",
  justOne: false
});
ApplicationSchema.plugin(MongooseError);
ApplicationSchema.plugin(findOrCreate);

export default mongoose.model('Application', ApplicationSchema);
