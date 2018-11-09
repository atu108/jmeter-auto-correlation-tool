'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _helper = require('../utility/helper');

var _jwt = require('../utility/jwt');

var _jwt2 = _interopRequireDefault(_jwt);

var _User = require('../models/User');

var _User2 = _interopRequireDefault(_User);

var _Project = require('../models/Project');

var _Project2 = _interopRequireDefault(_Project);

var _Scenario = require('../models/Scenario');

var _Scenario2 = _interopRequireDefault(_Scenario);

var _Recording = require('../models/Recording');

var _Recording2 = _interopRequireDefault(_Recording);

var _Step = require('../models/Step');

var _Step2 = _interopRequireDefault(_Step);

var _Run = require('../models/Run');

var _Run2 = _interopRequireDefault(_Run);

var _RunValue = require('../models/RunValue');

var _RunValue2 = _interopRequireDefault(_RunValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ApiController = function () {
  function ApiController() {
    _classCallCheck(this, ApiController);

    return {
      login: this.login.bind(this),
      projects: this.projects.bind(this),
      scenarios: this.scenarios.bind(this),
      save: this.save.bind(this)
    };
  }

  _createClass(ApiController, [{
    key: 'login',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx) {
        var user, token;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _User2.default.findOne({ email: ctx.request.body.email, password: (0, _helper.encrypt)(ctx.request.body.password) });

              case 2:
                user = _context.sent;

                if (!user) {
                  _context.next = 11;
                  break;
                }

                delete user.password;
                _context.next = 7;
                return _jwt2.default.set(user);

              case 7:
                token = _context.sent;
                return _context.abrupt('return', ctx.body = JSON.stringify({ token: token, user: user, type: 'success' }));

              case 11:
                console.log("no valid");

              case 12:
                return _context.abrupt('return', ctx.body = JSON.stringify({
                  type: 'error',
                  message: 'Invalid Login details'
                }));

              case 13:
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
    key: 'projects',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(ctx) {
        var projects;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return _Project2.default.find({ owner: ctx.auth.user.id, status: true }).exec();

              case 2:
                projects = _context2.sent;
                return _context2.abrupt('return', ctx.body = JSON.stringify({ projects: projects, type: 'success' }));

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function projects(_x2) {
        return _ref2.apply(this, arguments);
      }

      return projects;
    }()
  }, {
    key: 'scenarios',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(ctx) {
        var scenarios;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return _Scenario2.default.find({ project: ctx.params._id });

              case 2:
                scenarios = _context3.sent;
                return _context3.abrupt('return', ctx.body = JSON.stringify({ scenarios: scenarios, type: "success" }));

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function scenarios(_x3) {
        return _ref3.apply(this, arguments);
      }

      return scenarios;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(ctx) {
        var sid, _ctx$request$body, project_id, scenario_id, recording, name, scenario, r, steps, savedSteps, run, values;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                sid = false;
                _ctx$request$body = ctx.request.body, project_id = _ctx$request$body.project_id, scenario_id = _ctx$request$body.scenario_id, recording = _ctx$request$body.recording, name = _ctx$request$body.name;


                sid = scenario_id;

                if (!(!scenario_id && project_id && name)) {
                  _context4.next = 8;
                  break;
                }

                _context4.next = 6;
                return _Scenario2.default.create({
                  name: name,
                  project: project_id,
                  start_url: recording.startUrl
                });

              case 6:
                scenario = _context4.sent;

                sid = scenario._id;

              case 8:
                _context4.next = 10;
                return _Recording2.default.create({
                  start_url: recording.startUrl,
                  sequence_count: recording.sequence,
                  ua: recording.browserVersion,
                  scenario: sid
                });

              case 10:
                r = _context4.sent;
                steps = [];


                recording.steps.forEach(function (step) {
                  var temp = {
                    target: step.target,
                    command: step.command,
                    sequence: step.sequence,
                    scenario: sid,
                    recording: r._id
                  };

                  if (step.value) temp.value = step.value;

                  steps.push(temp);
                });

                _context4.next = 15;
                return _Step2.default.insertMany(steps);

              case 15:
                savedSteps = _context4.sent;
                _context4.next = 18;
                return _Run2.default.create({
                  scenario: sid,
                  title: "First Run",
                  description: "Saved using browser recorder",
                  status: "new"
                });

              case 18:
                run = _context4.sent;
                values = [];


                savedSteps.forEach(function (step) {
                  if (step.command === "assign") {
                    values.push({
                      target: step.target,
                      value: step.value,
                      sequence: step.sequence,
                      step: step._id,
                      run: run._id
                    });
                  }
                });

                _context4.next = 23;
                return _RunValue2.default.insertMany(values);

              case 23:
                return _context4.abrupt('return', ctx.body = { type: 'success', id: sid });

              case 24:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function save(_x4) {
        return _ref4.apply(this, arguments);
      }

      return save;
    }()
  }]);

  return ApiController;
}();

exports.default = new ApiController();