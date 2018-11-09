'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _mongooseFindorcreate = require('mongoose-findorcreate');

var _mongooseFindorcreate2 = _interopRequireDefault(_mongooseFindorcreate);

var _mongooseError = require('../utility/mongoose-error');

var _mongooseError2 = _interopRequireDefault(_mongooseError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

var DifferenceSchema = new Schema({
  url: String,
  sequence: Number,
  location: String,
  key: String,
  session_sequence: Number,
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
  second: {
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
  step: {
    type: Schema.Types.ObjectId,
    ref: "Step"
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: "Session"
  },
  scenario: {
    type: Schema.Types.ObjectId,
    ref: "Scenario"
  },

  added_on: {
    type: Date,
    default: Date.now
  },
  updated_on: {
    type: Date,
    default: Date.now
  },
  duplicate: {
    type: String,
    default: ''
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
DifferenceSchema.plugin(_mongooseError2.default);
DifferenceSchema.plugin(_mongooseFindorcreate2.default);

exports.default = _mongoose2.default.model('Difference', DifferenceSchema);