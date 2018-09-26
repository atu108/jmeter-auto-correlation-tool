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
    optimal_reg_number:Number,
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
        }

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
        }

    },
    backtrack_id:{ type: Schema.Types.ObjectId, ref: 'Backtrack' },
    session_id: { type: Schema.Types.ObjectId, ref: 'Session' },
    compare_id: { type: Schema.Types.ObjectId, ref: 'Compare' },
});


CorrelationSchema.plugin(MongooseError);
CorrelationSchema.plugin(findOrCreate);

export default mongoose.model('Correlation', CorrelationSchema);