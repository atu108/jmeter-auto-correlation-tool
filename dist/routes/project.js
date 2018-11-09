'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _auth = require('../middlewares/auth');

var _ProjectController = require('../controllers/ProjectController');

var _ProjectController2 = _interopRequireDefault(_ProjectController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = new _koaRouter2.default({
  prefix: '/app'
});

router.get('/', _auth.appAuth, _ProjectController2.default.index).get('/projects', _auth.appAuth, _ProjectController2.default.index).post('/project/save', _auth.appAuth, _ProjectController2.default.save).get('/project/:_id/scenarios', _auth.appAuth, _ProjectController2.default.scenarios);

exports.default = router;