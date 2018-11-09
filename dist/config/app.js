'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _env = require('../utility/env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = {
  host: (0, _env2.default)('HOST', '0.0.0.0'),
  port: (0, _env2.default)('PORT', 4000),
  name: 'testingtool-app',
  secret: 'ANJPV4070F',
  base: (0, _env2.default)('BASE', 'http://0.0.0.0:4000'),
  chrome: (0, _env2.default)("CHROME_DRIVER", ""),
  harGenerator: (0, _env2.default)("HAR_GENERATOR", "http://127.0.0.1:8080/")
};

exports.default = app;