'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _edge = require('edge.js');

var _edge2 = _interopRequireDefault(_edge);

var _helper = require('../utility/helper');

var _logger = require('../utility/logger');

var _logger2 = _interopRequireDefault(_logger);

var _jwt = require('../utility/jwt');

var _jwt2 = _interopRequireDefault(_jwt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx, next) {
    var start, user;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            start = new Date();

            if (!/^\/api\//.test(ctx.request.url)) {
              _context.next = 10;
              break;
            }

            if (!(ctx.request.headers['authorization'] && ctx.request.headers['authorization'] !== '')) {
              _context.next = 8;
              break;
            }

            _context.next = 6;
            return _jwt2.default.get(ctx.request.headers['authorization'].replace("Bearer ", ""));

          case 6:
            user = _context.sent;

            if (user) ctx.auth = { user: user };

          case 8:
            _context.next = 11;
            break;

          case 10:
            _edge2.default.global('authUser', ctx.session.user);

          case 11:
            _context.next = 13;
            return next();

          case 13:

            (0, _helper.logInfo)(start, ctx, _logger2.default);

            _context.next = 19;
            break;

          case 16:
            _context.prev = 16;
            _context.t0 = _context['catch'](0);

            _logger2.default.error(_context.t0);

          case 19:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[0, 16]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();