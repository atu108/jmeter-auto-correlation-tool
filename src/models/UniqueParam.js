import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const UniqueParamsSchema = new Schema({
    request:{
        type: Schema.Types.ObjectId,
        ref:"Request"
    },
    key:{
        type: Schema.Types.String
    },
    value:{
        type: Schema.Types.String
    },
    workflow:{
        type:Schema.Types.ObjectId,
        ref:"Workflow"
    },
    application:{
        type: Schema.Types.ObjectId,
        ref:"Application"
    },
    updated_on: {
        type: Date,
        default: Date.now
    },
    added_on: {
        type: Date,
        default: Date.now,
    }
});

UniqueParamsSchema.plugin(MongooseError);
UniqueParamsSchema.plugin(findOrCreate);

export default mongoose.model('UniqueParam', UniqueParamsSchema);