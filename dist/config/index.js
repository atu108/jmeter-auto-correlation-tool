'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _database = require('./database');

var _database2 = _interopRequireDefault(_database);

var _session = require('./session');

var _session2 = _interopRequireDefault(_session);

var _redis = require('./redis');

var _redis2 = _interopRequireDefault(_redis);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _mail = require('./mail');

var _mail2 = _interopRequireDefault(_mail);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var config = {
  app: _app2.default,
  database: _database2.default,
  storage: _storage2.default,
  session: _session2.default,
  redis: _redis2.default,
  log: _log2.default,
  mail: _mail2.default
};

exports.default = config;