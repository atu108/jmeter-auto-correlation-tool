'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apiAuth = exports.appAuth = undefined;

var _helper = require('../utility/helper');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var appAuth = exports.appAuth = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx, next) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;


            if (!ctx.session.user && ctx.request.header['request-type'] === 'ajax') {
              ctx.body = _helper.responses[401];
            }

            if (!ctx.session.user && ctx.request.header['request-type'] !== 'ajax') {
              ctx.redirect('/app/auth/login');
            }

            _context.next = 5;
            return next();

          case 5:
            _context.next = 10;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context['catch'](0);

            ctx.body = _helper.responses[_context.t0.status];

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[0, 7]]);
  }));

  return function appAuth(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var apiAuth = exports.apiAuth = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(ctx, next) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            if (ctx.auth) {
              _context2.next = 4;
              break;
            }

            ctx.body = _helper.responses[401];
            return _context2.abrupt('return');

          case 4:
            _context2.next = 6;
            return next();

          case 6:
            _context2.next = 11;
            break;

          case 8:
            _context2.prev = 8;
            _context2.t0 = _context2['catch'](0);

            ctx.body = _helper.responses[_context2.t0.status];

          case 11:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined, [[0, 8]]);
  }));

  return function apiAuth(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();