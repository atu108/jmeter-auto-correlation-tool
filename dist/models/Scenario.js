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

var ScenarioSchema = new Schema({
  name: String,
  description: String,
  start_url: String,
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project"
  },
  added_on: {
    type: Date,
    default: Date.now
  },
  updated_on: {
    type: Date,
    default: Date.now
  },
  status: Boolean
});

ScenarioSchema.plugin(_mongooseError2.default);
ScenarioSchema.plugin(_mongooseFindorcreate2.default);

exports.default = _mongoose2.default.model('Scenario', ScenarioSchema);