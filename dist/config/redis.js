'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _env = require('../utility/env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var redis = {
  host: (0, _env2.default)('REDIS_HOST', '127.0.0.1'),
  port: (0, _env2.default)('REDIS_PORT', 6379),
  /**
   * Redis use database name as index by default its provides 1-15 indexes
   */
  db: (0, _env2.default)('REDIS_DB', 1),
  password: (0, _env2.default)('REDIS_PASSWORD', '')
};

exports.default = redis;