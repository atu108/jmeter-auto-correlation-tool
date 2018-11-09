'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _AuthController = require('../controllers/AuthController');

var _AuthController2 = _interopRequireDefault(_AuthController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = new _koaRouter2.default({
  prefix: '/app/auth'
});

router.get('/logout', _AuthController2.default.logout).get('/login', _AuthController2.default.login).post('/login', _AuthController2.default.login).get('/register', _AuthController2.default.register).post('/register', _AuthController2.default.register);

exports.default = router;