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
    reg: String,
    final_regex:String,
    first: {
        url:String,
        matched:String,
        session_title:String,
        session_sequence: Number,
        request: {
            type: Schema.Types.ObjectId,
            ref: "Request"
        },
        run: {
            type: Schema.Types.ObjectId,
            ref: "Run"
        },
        atPos: Number

    },
    second: {
        url:String,
        matched:String,
        session_title:{
            type:String,
            default:''
        },
        session_sequence:{
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
        atPos: Number
    },
    scenario:{
        type: Schema.Types.ObjectId,
        ref:"Scenario"
    },
    difference:{
        type: Schema.Types.ObjectId,
        ref:"Difference"
    }
});


CorrelationSchema.plugin(MongooseError);
CorrelationSchema.plugin(findOrCreate);

export default mongoose.model('Correlation', CorrelationSchema);