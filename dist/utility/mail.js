'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nodemailer = require('nodemailer');

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _queue = require('.//queue');

var _queue2 = _interopRequireDefault(_queue);

var _logger = require('.//logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Email = function () {
  function Email() {
    _classCallCheck(this, Email);

    return {
      send: this.send.bind(this),
      init: this.init.bind(this)
    };
  }

  _createClass(Email, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.mailer = _nodemailer2.default.createTransport(_config2.default.mail);

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init() {
        return _ref.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: 'send',
    value: function send(data) {
      var priority = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'normal';

      _queue2.default.mail(data, priority);
      _queue2.default.execute('mail', this._mail.bind(this));
    }
  }, {
    key: '_mail',
    value: function _mail(data, cb) {
      this.mailer.sendMail(data, function (error, info) {
        if (error) {
          _logger2.default.error(error);
          return cb(error);
        }
        _logger2.default.info("Mail sent " + info.messageId);
        cb();
      });
    }
  }]);

  return Email;
}();

exports.default = new Email();