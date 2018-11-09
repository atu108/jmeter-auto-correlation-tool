'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _template = require('./template');

var _template2 = _interopRequireDefault(_template);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _helper = require('./helper');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx, next) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return next();

          case 3:
            _context.t0 = ctx.status;
            _context.next = _context.t0 === 404 ? 6 : _context.t0 === 500 ? 8 : 10;
            break;

          case 6:
            ctx.body = _template2.default.render('page.error', { error: _helper.responses[404] });
            return _context.abrupt('break', 10);

          case 8:
            ctx.body = _template2.default.render('page.error', { error: _helper.responses[500] });
            return _context.abrupt('break', 10);

          case 10:
            _context.next = 15;
            break;

          case 12:
            _context.prev = 12;
            _context.t1 = _context['catch'](0);

            _logger2.default.error(_context.t1);

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[0, 12]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();