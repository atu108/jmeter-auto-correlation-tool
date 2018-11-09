'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _koaCombineRouters = require('koa-combine-routers');

var _koaCombineRouters2 = _interopRequireDefault(_koaCombineRouters);

var _page = require('./page');

var _page2 = _interopRequireDefault(_page);

var _auth = require('./auth');

var _auth2 = _interopRequireDefault(_auth);

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

var _project = require('./project');

var _project2 = _interopRequireDefault(_project);

var _scenario = require('./scenario');

var _scenario2 = _interopRequireDefault(_scenario);

var _run = require('./run');

var _run2 = _interopRequireDefault(_run);

var _session = require('./session');

var _session2 = _interopRequireDefault(_session);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _koaCombineRouters2.default)([_page2.default, _auth2.default, _api2.default, _project2.default, _scenario2.default, _run2.default, _session2.default]);