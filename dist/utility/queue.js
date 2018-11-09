'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _kue = require('kue');

var _kue2 = _interopRequireDefault(_kue);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var options = {
  prefix: 'q',
  redis: {
    port: _config2.default.redis.port,
    host: _config2.default.redis.host,
    auth: _config2.default.redis.password,
    db: 3
  },
  jobEvents: false // for memory optimization
};

var interval = 5000;

var Queue = function () {
  function Queue() {
    _classCallCheck(this, Queue);

    return {
      init: this.init.bind(this),
      log: this.log.bind(this),
      mail: this.mail.bind(this),
      execute: this.execute.bind(this)
    };
  }

  _createClass(Queue, [{
    key: 'init',
    value: function init() {
      this.q = _kue2.default.createQueue(options);
      this.q.watchStuckJobs(interval);
      this.job = _kue2.default.Job;
      this._queue_events();
    }
  }, {
    key: 'log',
    value: function log(data) {
      var priority = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'normal';

      return this._push('log', data, priority);
    }
  }, {
    key: 'mail',
    value: function mail(data) {
      var priority = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'normal';

      return this._push('mail', data, priority);
    }
  }, {
    key: 'execute',
    value: function execute(type, cb) {
      this.q.process(type, 1, function (job, callback) {
        cb(job.data, callback);
      });
    }
  }, {
    key: '_push',
    value: function _push(id, data) {
      var priority = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'normal';

      return this.q.create(id, data).priority(priority).removeOnComplete(true).attempts(5).save();
    }
  }, {
    key: '_queue_events',
    value: function _queue_events() {
      this.q.on('error', function (err) {
        return _logger2.default.error(err);
      });
    }
  }]);

  return Queue;
}();

exports.default = new Queue();