'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _auth = require('../middlewares/auth');

var _RunController = require('../controllers/RunController');

var _RunController2 = _interopRequireDefault(_RunController);

var _backtrack = require('../cron/backtrack');

var _backtrack2 = _interopRequireDefault(_backtrack);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = new _koaRouter2.default({
  prefix: '/app/run'
});

router.post('/record', _auth.appAuth, _RunController2.default.record).post('/save', _auth.appAuth, _RunController2.default.save).post('/compare', _auth.appAuth, _RunController2.default.compare).post('/delete', _auth.appAuth, _RunController2.default.delete).post('/backtrack', _auth.appAuth, _RunController2.default.backtrack);

exports.default = router;