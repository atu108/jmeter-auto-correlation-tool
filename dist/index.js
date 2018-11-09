'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('babel-polyfill');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _koaBody = require('koa-body');

var _koaBody2 = _interopRequireDefault(_koaBody);

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _koaStatic = require('koa-static');

var _koaStatic2 = _interopRequireDefault(_koaStatic);

var _koaGenericSession = require('koa-generic-session');

var _koaGenericSession2 = _interopRequireDefault(_koaGenericSession);

var _koaRedis = require('koa-redis');

var _koaRedis2 = _interopRequireDefault(_koaRedis);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _routes = require('./routes');

var _routes2 = _interopRequireDefault(_routes);

var _logger = require('./utility/logger');

var _logger2 = _interopRequireDefault(_logger);

var _mail = require('./utility/mail');

var _mail2 = _interopRequireDefault(_mail);

var _queue = require('./utility/queue');

var _queue2 = _interopRequireDefault(_queue);

var _error = require('./utility/error');

var _error2 = _interopRequireDefault(_error);

var _response = require('./middlewares/response');

var _response2 = _interopRequireDefault(_response);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.connect(_config2.default.database.uri, {
  useMongoClient: true
});
_mongoose2.default.connection.on('error', _logger2.default.error);
_mongoose2.default.Promise = global.Promise;

var app = new _koa2.default();

app.keys = [_config2.default.app.secret, 'testingtool-app'];

app.use((0, _koaBody2.default)({
  formidable: { uploadDir: './uploads' },
  multipart: true, limit: '50mb' })).use((0, _koaStatic2.default)(_path2.default.join(__dirname, 'static'), {
  gzip: true
})).use((0, _koaStatic2.default)(_path2.default.join(__dirname, '../uploads'), {
  gzip: true
})).use((0, _koaGenericSession2.default)({
  key: _config2.default.session.key,
  path: '/',
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  overwrite: true,
  signed: true,
  store: (0, _koaRedis2.default)(_config2.default.redis)
})).use(_response2.default).use(_routes2.default).use(_error2.default);

app.on('error', function (err) {
  _logger2.default.error(err);
});

// Start the application
app.listen(_config2.default.app.port, _config2.default.app.host, function () {
  console.log('\uD83D\uDDA5  Server started at http://0.0.0.0:' + _config2.default.app.port + '/');
  _logger2.default.info('Server started at http://0.0.0.0:' + _config2.default.app.port + '/');
});

_queue2.default.init();
_mail2.default.init();

exports.default = app;