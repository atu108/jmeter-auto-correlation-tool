'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _User = require('../models/User');

var _User2 = _interopRequireDefault(_User);

var _helper = require('../utility/helper');

var _template = require('../utility/template');

var _template2 = _interopRequireDefault(_template);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AuthController = function () {
  function AuthController() {
    _classCallCheck(this, AuthController);

    return {
      login: this.login.bind(this),
      register: this.register.bind(this),
      logout: this.logout.bind(this)
    };
  }

  _createClass(AuthController, [{
    key: 'login',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx) {
        var user;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!ctx.session.user) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', ctx.redirect('/app'));

              case 2:
                if (!(ctx.request.method.toLowerCase() === 'post')) {
                  _context.next = 8;
                  break;
                }

                _context.next = 5;
                return _User2.default.findOne({ email: ctx.request.body.email, password: (0, _helper.encrypt)(ctx.request.body.password) });

              case 5:
                user = _context.sent;


                if (user) {
                  delete user.password;
                  ctx.session.user = user;
                  ctx.body = JSON.stringify({ type: 'success', message: 'Login success, redirecting...', redirect: '/app', _token: 'ANJPP4070F', user: user });
                } else {
                  ctx.body = JSON.stringify({ type: 'error', message: 'Invalid Login details' });
                }
                return _context.abrupt('return');

              case 8:

                ctx.body = _template2.default.render('app.auth.login', { global: { header: false, footer: false } });

              case 9:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function login(_x) {
        return _ref.apply(this, arguments);
      }

      return login;
    }()
  }, {
    key: 'register',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(ctx) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!ctx.session.user) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return', ctx.redirect('/app'));

              case 2:

                if (ctx.request.method.toLowerCase() === 'post') {}

                ctx.body = _template2.default.render('app.auth.register', { global: { header: false, footer: false } });

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function register(_x2) {
        return _ref2.apply(this, arguments);
      }

      return register;
    }()
  }, {
    key: 'logout',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(ctx) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                ctx.session = null;
                ctx.redirect('/');

              case 2:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function logout(_x3) {
        return _ref3.apply(this, arguments);
      }

      return logout;
    }()
  }]);

  return AuthController;
}();

exports.default = new AuthController();