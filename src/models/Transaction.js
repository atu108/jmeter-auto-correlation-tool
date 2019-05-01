import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';
import MongooseError from '../utility/mongoose-error';

const Schema = mongoose.Schema;
const TransactionSchema = new Schema({
  title: String,
  sequence: Number,
  added_on: {
    type: Date,
    default: Date.now()
  },
  updated_on:{
    type:Date,
    default: Date.now()
  },
  run: {
    type: Schema.Types.ObjectId, 
    ref: 'Run'
  }
});

TransactionSchema.plugin(MongooseError);
TransactionSchema.plugin(findOrCreate);
export default mongoose.model('Transaction', TransactionSchema);
