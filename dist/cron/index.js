'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _child_process = require('child_process');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Cron = function Cron(module, params) {
  _classCallCheck(this, Cron);

  var child = (0, _child_process.fork)(_path2.default.join(__dirname, '../cron/' + module + '.js'));
  child.send(params);

  return {
    done: function done(callback) {
      child.on('message', callback);
    }
  };
};

exports.default = Cron;