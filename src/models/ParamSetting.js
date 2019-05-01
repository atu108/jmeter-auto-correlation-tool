import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const ParamSetting = new Schema({
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

ParamSetting.plugin(MongooseError);
ParamSetting.plugin(findOrCreate);

export default mongoose.model('ParamSetting', ParamSetting);