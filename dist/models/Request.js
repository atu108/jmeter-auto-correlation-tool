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

var RequestSchema = new Schema({
  url: String,
  sequence: Number,
  session_sequence: Number,
  request: {
    method: String,
    url: String,
    params: [],
    post_data: [],
    headers: [],
    cookies: []
  },
  response: {
    status: Number,
    body: String,
    headers: [],
    cookies: []
  },
  run: {
    type: Schema.Types.ObjectId,
    ref: "Run"
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
  }
});

RequestSchema.plugin(_mongooseError2.default);
RequestSchema.plugin(_mongooseFindorcreate2.default);

exports.default = _mongoose2.default.model('Request', RequestSchema);