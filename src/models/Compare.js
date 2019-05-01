import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const CompareSchema = new Schema({
  title: String,
  runs: [{
    type: Schema.Types.ObjectId,
    ref: "Run"
  }],
  workflow:{
      type:Schema.Types.ObjectId,
        ref:"Workflow"
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

CompareSchema.plugin(MongooseError);
CompareSchema.plugin(findOrCreate);

export default mongoose.model('Compare', CompareSchema);