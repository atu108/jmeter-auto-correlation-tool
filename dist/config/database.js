'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _env = require('../utility/env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var database = {
  host: (0, _env2.default)('DB_HOST', '127.0.0.1'),
  port: (0, _env2.default)('DB_PORT', 27017),
  user: (0, _env2.default)('DB_USER', ''),
  password: (0, _env2.default)('DB_PASSWORD', ''),
  name: (0, _env2.default)('DB_NAME', 'impulsive'),
  replica: (0, _env2.default)('DB_REPLICA', false)
};

database.uri = 'mongodb://' + database.host + '/' + database.name;
if (database.user !== '') database.uri = 'mongodb://' + database.user + ':' + encodeURIComponent(database.password) + '@' + database.host + ':' + database.port + '/' + database.name + '?authSource=admin';

exports.default = database;