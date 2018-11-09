'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _kue = require('kue');

var _kue2 = _interopRequireDefault(_kue);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _UserActivity = require('../models/UserActivity');

var _UserActivity2 = _interopRequireDefault(_UserActivity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var queue = _kue2.default.createQueue({
  prefix: 'q',
  redis: {
    port: _config2.default.redis.port,
    host: _config2.default.redis.host,
    auth: _config2.default.redis.password,
    db: _config2.default.redis.db
  } });

var TaskQueue = function () {
  function TaskQueue() {
    _classCallCheck(this, TaskQueue);

    return {
      createJob: this.createJob.bind(this)
    };
  }

  _createClass(TaskQueue, [{
    key: 'createJob',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(jobType, data) {
        var _this = this;

        var job;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                job = queue.create(jobType, data).save(function () {
                  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(err) {
                    return regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            if (err) {
                              _context.next = 3;
                              break;
                            }

                            _context.next = 3;
                            return _this.executeJob(jobType);

                          case 3:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this);
                  }));

                  return function (_x3) {
                    return _ref2.apply(this, arguments);
                  };
                }());

                job.on('complete', function () {
                  console.log('Job completed with data');
                }).on('failed', function (errorMessage) {
                  console.log('Job failed');
                });

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function createJob(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return createJob;
    }()
  }, {
    key: 'executeJob',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(type) {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                queue.process(type, function () {
                  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(job, done) {
                    return regeneratorRuntime.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            _context3.next = 2;
                            return _this2._saveActivity(job.data, done);

                          case 2:
                          case 'end':
                            return _context3.stop();
                        }
                      }
                    }, _callee3, _this2);
                  }));

                  return function (_x5, _x6) {
                    return _ref4.apply(this, arguments);
                  };
                }());

              case 1:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function executeJob(_x4) {
        return _ref3.apply(this, arguments);
      }

      return executeJob;
    }()
  }, {
    key: '_saveActivity',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(data, done) {
        var activity;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return _UserActivity2.default.create(data);

              case 2:
                activity = _context5.sent;

                if (activity) {
                  _context5.next = 5;
                  break;
                }

                return _context5.abrupt('return', done(new Error('Can not save activity')));

              case 5:
                done();

              case 6:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function _saveActivity(_x7, _x8) {
        return _ref5.apply(this, arguments);
      }

      return _saveActivity;
    }()
  }]);

  return TaskQueue;
}();

exports.default = new TaskQueue();