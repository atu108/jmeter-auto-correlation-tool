'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VARS = _dotenv2.default.parse(_fs2.default.readFileSync(_path2.default.join(__dirname, '../../.env')));

var env = function env(key, d) {
  if (VARS[key]) return VARS[key];
  return d;
};

exports.default = env;