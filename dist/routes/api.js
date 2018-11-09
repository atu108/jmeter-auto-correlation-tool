'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _auth = require('../middlewares/auth');

var _ApiController = require('../controllers/ApiController');

var _ApiController2 = _interopRequireDefault(_ApiController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = new _koaRouter2.default({
  prefix: '/api'
});

router.post('/login', _ApiController2.default.login).get('/projects', _auth.apiAuth, _ApiController2.default.projects).get('/project/:_id/scenarios', _ApiController2.default.scenarios).post('/save', _ApiController2.default.save);

exports.default = router;