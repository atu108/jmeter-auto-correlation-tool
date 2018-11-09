'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _env = require('../utility/env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = {
  path: (0, _env2.default)('LOG_PATH', '/home/lalit/webroot/testingtool/log/')
};

exports.default = log;