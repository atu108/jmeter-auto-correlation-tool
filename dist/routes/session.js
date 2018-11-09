'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _auth = require('../middlewares/auth');

var _SessionController = require('../controllers/SessionController');

var _SessionController2 = _interopRequireDefault(_SessionController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = new _koaRouter2.default({
    prefix: '/app/session'
});

router.post('/save', _auth.appAuth, _SessionController2.default.save);

exports.default = router;