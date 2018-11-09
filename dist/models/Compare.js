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

var CompareSchema = new Schema({
  title: String,
  runs: [{
    type: Schema.Types.ObjectId,
    ref: "Run"
  }],
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
  status: String
});

CompareSchema.plugin(_mongooseError2.default);
CompareSchema.plugin(_mongooseFindorcreate2.default);

exports.default = _mongoose2.default.model('Compare', CompareSchema);