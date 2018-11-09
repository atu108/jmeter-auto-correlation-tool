'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path2 = require('path');

var _path3 = _interopRequireDefault(_path2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _queue = require('./queue');

var _queue2 = _interopRequireDefault(_queue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEBUG = 100;
var INFO = 200;
var WARNING = 300;
var ERROR = 400;

var levels = {
  100: 'DEBUG',
  200: 'INFO',
  300: 'WARNING',
  400: 'ERROR'
};

var Logger = function () {
  function Logger() {
    _classCallCheck(this, Logger);

    return {
      error: this._log.bind(this, ERROR),
      debug: this._log.bind(this, DEBUG),
      warn: this._log.bind(this, WARNING),
      info: this._log.bind(this, INFO)
    };
  }

  _createClass(Logger, [{
    key: '_path',
    value: function _path() {
      var date = new Date();
      return _path3.default.join(_config2.default.log.path, 'App-' + (0, _moment2.default)(date).format('YYYY-MM-DD') + '.log');
    }
  }, {
    key: '_log',
    value: function _log(level, error, name) {
      var formatted = this._format(level, error, name);
      _queue2.default.log({ message: formatted });
      _queue2.default.execute('log', this._write.bind(this));
    }
  }, {
    key: '_write',
    value: function _write(data, cb) {
      return _fs2.default.writeFile(this._path(), data.message + "\r\n", {
        flag: "a"
      }, function (err, res) {
        if (!err) cb();
      });
    }
  }, {
    key: '_format',
    value: function _format(level, error) {
      var name = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'APP';

      if (error.stack) error = error.stack;
      return this._date() + ' ' + name + '-' + levels[level] + ': ' + error;
    }
  }, {
    key: '_date',
    value: function _date() {
      var date = new Date();
      return '[' + (0, _moment2.default)(date).format('YYYY-MM-DD') + ']';
    }
  }]);

  return Logger;
}();

exports.default = new Logger();