import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const DifferenceSchema = new Schema({
  url: String,
  sequence: Number,
  location: String,
  key: String,
  txn_sequence:Number,
  first: {
    value: String,
    request: {
      type: Schema.Types.ObjectId,
      ref: "Request"
    },
    run: {
      type: Schema.Types.ObjectId,
      ref: "Run"
    }
  },
  second:{
    value: String,
    request: {
      type: Schema.Types.ObjectId,
      ref: "Request"
    },
    run: {
      type: Schema.Types.ObjectId,
      ref: "Run"
    }
  },
  transaction:{
    type:Schema.Types.ObjectId,
    ref:"Transaction"
  },
  workflow: {
    type: Schema.Types.ObjectId,
    ref: "Workflow"
  },

  added_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now
  },
  duplicate:{
    type:String,
      default:''
  }

});
// DifferenceSchema.virtual("firstRequest", {
//     ref: "Request",
//     localField: "first.request",
//     foreignField: "_id",
//     justOne: false
// });
// DifferenceSchema.virtual("secondRequest", {
//     ref: "Request",
//     localField: "request",
//     foreignField: "_id",
//     justOne: false
// });
// DifferenceSchema.virtual("Session", {
//     ref: "Session",
//     localField: "session",
//     foreignField: "_id",
//     justOne: false
// });
DifferenceSchema.plugin(MongooseError);
DifferenceSchema.plugin(findOrCreate);

export default mongoose.model('Difference', DifferenceSchema);
