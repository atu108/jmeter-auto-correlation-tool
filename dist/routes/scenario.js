'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _auth = require('../middlewares/auth');

var _ScenarioController = require('../controllers/ScenarioController');

var _ScenarioController2 = _interopRequireDefault(_ScenarioController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = new _koaRouter2.default({
  prefix: '/app/scenario'
});

router.get('/:_id/steps', _auth.appAuth, _ScenarioController2.default.steps).get('/:_id/runs', _auth.appAuth, _ScenarioController2.default.runs).post("/save", _auth.appAuth, _ScenarioController2.default.save).get('/:_id/differnces', _auth.appAuth, _ScenarioController2.default.differences).get('/:_id/corelations', _auth.appAuth, _ScenarioController2.default.correlations).post('/delete', _auth.appAuth, _ScenarioController2.default.delete);

exports.default = router;