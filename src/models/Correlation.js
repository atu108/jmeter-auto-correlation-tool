import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;

const CorrelationSchema = new Schema({
    key:String,
    priority:Number,
    compared_url:String,
    location: String,
    reg_count:String,
    reg_name:{
        toReplace: [String],
        withWhat: [String]
    },
    reg_final_name: String,
    final_regex:String,
    first: {
        url:String,
        matched:String,
        txn_title:String,
        txn_sequence: Number,
        request: {
            type: Schema.Types.ObjectId,
            ref: "Request"
        },
        run: {
            type: Schema.Types.ObjectId,
            ref: "Run"
        },
        atPos: String

    },
    second: {
        url:String,
        matched:String,
        txn_title:{
            type:String,
            default:''
        },
        txn_sequence:{
            type:Number,
            default:0
        },
        request: {
            type: Schema.Types.ObjectId,
            ref: "Request"
        },
        run: {
            type: Schema.Types.ObjectId,
            ref: "Run"
        },
        atPos: String
    },
    workflow:{
        type: Schema.Types.ObjectId,
        ref:"Workflow"
    },
    difference:{
        type: Schema.Types.ObjectId,
        ref:"Difference"
    }
});


CorrelationSchema.plugin(MongooseError);
CorrelationSchema.plugin(findOrCreate);

export default mongoose.model('Correlation', CorrelationSchema);