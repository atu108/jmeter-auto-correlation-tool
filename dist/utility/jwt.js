'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _es6Promisify = require('es6-promisify');

var _es6Promisify2 = _interopRequireDefault(_es6Promisify);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _helper = require('./helper');

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Jwt = function () {
  function Jwt() {
    _classCallCheck(this, Jwt);

    this.jwt = {
      sign: (0, _es6Promisify2.default)(_jsonwebtoken2.default.sign, _jsonwebtoken2.default),
      verify: (0, _es6Promisify2.default)(_jsonwebtoken2.default.verify, _jsonwebtoken2.default)
    };

    return {
      get: this.get.bind(this),
      set: this.set.bind(this)
    };
  }

  _createClass(Jwt, [{
    key: 'get',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(token) {
        var payload;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return this.jwt.verify(token, _config2.default.app.secret);

              case 3:
                payload = _context.sent;

                if (!payload) {
                  _context.next = 6;
                  break;
                }

                return _context.abrupt('return', payload);

              case 6:
                _context.next = 12;
                break;

              case 8:
                _context.prev = 8;
                _context.t0 = _context['catch'](0);

                _logger2.default.error(_context.t0);
                throw { message: _helper.errorMessages.INVALID_TOKEN, name: 'Authorization Error' };

              case 12:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 8]]);
      }));

      function get(_x) {
        return _ref.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: 'set',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(user) {
        var payload, tokens;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                payload = {
                  id: user.id,
                  email: user.email,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  generated_at: Date.now()
                };
                _context2.next = 4;
                return this.jwt.sign(payload, _config2.default.app.secret);

              case 4:
                tokens = _context2.sent;
                return _context2.abrupt('return', tokens);

              case 8:
                _context2.prev = 8;
                _context2.t0 = _context2['catch'](0);

                _logger2.default.error(_context2.t0);

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 8]]);
      }));

      function set(_x2) {
        return _ref2.apply(this, arguments);
      }

      return set;
    }()
  }]);

  return Jwt;
}();

exports.default = new Jwt();