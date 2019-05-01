import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const SecenarioWorkflowMapSchema = new Schema({
 scenario:{
    type: Schema.Types.ObjectId,
    ref: "Scenario"
 },
 workflow:{
    type: Schema.Types.ObjectId,
    ref: "Workflow"
 },
 application: {
    type: Schema.Types.ObjectId,
    ref: "Application"
  },
 added_on:{
    type: Date,
    default: Date.now,
  },
 updated_on: {
    type: Date,
    default: Date.now
  },
  completed: Boolean
});

SecenarioWorkflowMapSchema.plugin(MongooseError);
SecenarioWorkflowMapSchema.plugin(findOrCreate);

export default mongoose.model('SecenarioWorkflowMap', SecenarioWorkflowMapSchema);
