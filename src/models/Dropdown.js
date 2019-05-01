import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const DropdownSchema = new Schema({
    selenium_step: {
        type: Schema.Types.ObjectId,
        ref: "SeleniumStep"
    },
    workflow: {
      type: Schema.Types.ObjectId,
      ref: "Workflow"
    },
    options: [],
    added_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now
  },
});

DropdownSchema.plugin(MongooseError);
DropdownSchema.plugin(findOrCreate);

export default mongoose.model('Dropdown', DropdownSchema);