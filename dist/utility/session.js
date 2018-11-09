'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _redis = require('redis');

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

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

var Session = function () {
  function Session() {
    _classCallCheck(this, Session);

    var redisOptions = {
      host: _config2.default.redis.host,
      port: _config2.default.redis.port,
      db: _config2.default.redis.db
    };

    if (_config2.default.redis.password !== '') redisOptions.password = _config2.default.redis.password;

    var redis = (0, _redis.createClient)(redisOptions);

    redis.on("error", function (err) {
      _logger2.default.error(err);
    });

    this.generateBytes = (0, _es6Promisify2.default)(_crypto2.default.randomBytes, _crypto2.default);

    this.redis = {
      set: (0, _es6Promisify2.default)(redis.set, redis),
      get: (0, _es6Promisify2.default)(redis.get, redis),
      del: (0, _es6Promisify2.default)(redis.del, redis)
    };

    return {
      id: this.id.bind(this),
      get: this.get.bind(this),
      set: this.set.bind(this),
      destroy: this.destroy.bind(this)
    };
  }

  _createClass(Session, [{
    key: 'id',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 24;
        var bytes;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.generateBytes(length);

              case 2:
                bytes = _context.sent;
                return _context.abrupt('return', bytes.toString('hex'));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function id() {
        return _ref.apply(this, arguments);
      }

      return id;
    }()
  }, {
    key: 'get',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(key) {
        var data;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.redis.get(_config2.default.session.key + ':' + key);

              case 2:
                data = _context2.sent;
                return _context2.abrupt('return', JSON.parse(data));

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function get(_x2) {
        return _ref2.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: 'set',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(key, data) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                console.log(key);
                _context3.next = 3;
                return this.redis.set(_config2.default.session.key + ':' + key, JSON.stringify(data));

              case 3:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function set(_x3, _x4) {
        return _ref3.apply(this, arguments);
      }

      return set;
    }()
  }, {
    key: 'destroy',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(key) {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.redis.del(_config2.default.session.key + ':' + key);

              case 2:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function destroy(_x5) {
        return _ref4.apply(this, arguments);
      }

      return destroy;
    }()
  }]);

  return Session;
}();

exports.default = function (conf) {
  var store = new Session();
  var KEY = "SESSIONID";
  var config = {};

  if (conf.key) KEY = conf.key;

  return function () {
    var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(ctx, next) {
      var id, _sid, old, sid;

      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              id = ctx.cookies.get(KEY, config);

              if (id) {
                _context5.next = 9;
                break;
              }

              _context5.next = 4;
              return store.id();

            case 4:
              _sid = _context5.sent;

              ctx.session = {};
              ctx.cookies.set(KEY, _sid, config);
              _context5.next = 13;
              break;

            case 9:
              _context5.next = 11;
              return store.get(id);

            case 11:
              ctx.session = _context5.sent;


              if (_typeof(ctx.session) !== "object" || ctx.session == null) {
                ctx.session = {};
              }

            case 13:
              old = JSON.stringify(ctx.session);
              _context5.next = 16;
              return next();

            case 16:
              if (!(old === JSON.stringify(ctx.session))) {
                _context5.next = 18;
                break;
              }

              return _context5.abrupt('return');

            case 18:
              if (!(id && !ctx.session)) {
                _context5.next = 22;
                break;
              }

              _context5.next = 21;
              return store.destroy(id);

            case 21:
              return _context5.abrupt('return');

            case 22:
              _context5.next = 24;
              return store.id();

            case 24:
              sid = _context5.sent;
              _context5.next = 27;
              return store.set(sid, ctx.session);

            case 27:
              ctx.cookies.set(KEY, sid, config);

            case 28:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, undefined);
    }));

    return function (_x6, _x7) {
      return _ref5.apply(this, arguments);
    };
  }();
};