'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _env = require('../utility/env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var storage = {
  path: '/home/lalit/webroot/testingtool/jmx/',
  temp: (0, _env2.default)("TEMP_PATH", "")
};

exports.default = storage;