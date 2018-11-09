'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _template = require('../utility/template');

var _template2 = _interopRequireDefault(_template);

var _helper = require('../utility/helper');

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

var _Difference = require('../models/Difference');

var _Difference2 = _interopRequireDefault(_Difference);

var _Correlation = require('../models/Correlation');

var _Correlation2 = _interopRequireDefault(_Correlation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _tabs = [{
  label: "Runs",
  action: "runs",
  controller: "scenario"
}, {
  label: "Steps",
  action: "steps",
  controller: "scenario"
}, {
  label: "Differences",
  action: "differnces",
  controller: "scenario"
}, {
  label: "Corelations",
  action: "corelations",
  controller: "scenario"
}];

var ScenarioController = function () {
  function ScenarioController() {
    _classCallCheck(this, ScenarioController);

    return {
      delete: this.delete.bind(this),
      steps: this.steps.bind(this),
      runs: this.runs.bind(this),
      differences: this.differences.bind(this),
      correlations: this.correlations.bind(this),
      save: this.save.bind(this)
    };
  }

  _createClass(ScenarioController, [{
    key: 'delete',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _Recording2.default.deleteMany({ scenario: { $in: ctx.request.body } });

              case 2:
                _context.next = 4;
                return _Step2.default.deleteMany({ scenario: { $in: ctx.request.body } });

              case 4:
                _context.next = 6;
                return _Run2.default.deleteMany({ scenario: { $in: ctx.request.body } });

              case 6:
                _context.next = 8;
                return _RunValue2.default.deleteMany({ scenario: { $in: ctx.request.body } });

              case 8:
                _context.next = 10;
                return _Scenario2.default.deleteMany({ _id: { $in: ctx.request.body } });

              case 10:

                ctx.body = JSON.stringify({
                  type: "success",
                  message: "Deleted successfully, reloading...",
                  reload: true
                });

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _delete(_x) {
        return _ref.apply(this, arguments);
      }

      return _delete;
    }()
  }, {
    key: 'steps',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(ctx) {
        var scenario, steps;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return _Scenario2.default.findById(ctx.params._id);

              case 2:
                scenario = _context2.sent;
                _context2.next = 5;
                return _Step2.default.find({ scenario: ctx.params._id });

              case 5:
                steps = _context2.sent;

                ctx.body = _template2.default.render('app.scenario.steps', { steps: steps, scenario: scenario, global: { title: scenario.name, tabs: _tabs, _id: ctx.params._id, current: "steps", sub: "Steps", back: '/app/project/' + scenario.project + '/scenarios' } });

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function steps(_x2) {
        return _ref2.apply(this, arguments);
      }

      return steps;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(ctx) {
        var _ctx$request$body, name, project, start_url;

        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                console.log("here", ctx);
                _ctx$request$body = ctx.request.body, name = _ctx$request$body.name, project = _ctx$request$body.project, start_url = _ctx$request$body.start_url;
                _context3.next = 4;
                return _Scenario2.default.create({ name: name, project: project, start_url: start_url });

              case 4:
                ctx.body = JSON.stringify({
                  type: "success",
                  message: "Project saved, reloading...",
                  reload: true
                });

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function save(_x3) {
        return _ref3.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'runs',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(ctx) {
        var scenario, runs;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return _Scenario2.default.findById(ctx.params._id);

              case 2:
                scenario = _context4.sent;
                _context4.next = 5;
                return _Run2.default.find({ scenario: ctx.params._id }).populate('sessions');

              case 5:
                runs = _context4.sent;

                ctx.body = _template2.default.render('app.scenario.runs', { runs: runs, scenario: scenario, global: { title: scenario.name, tabs: _tabs, _id: ctx.params._id, current: "runs", sub: "Runs", back: '/app/project/' + scenario.project + '/scenarios' } });

              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function runs(_x4) {
        return _ref4.apply(this, arguments);
      }

      return runs;
    }()
  }, {
    key: 'differences',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(ctx) {
        var scenario, differences;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return _Scenario2.default.findById(ctx.params._id);

              case 2:
                scenario = _context5.sent;
                _context5.next = 5;
                return _Difference2.default.find({ scenario: ctx.params._id });

              case 5:
                differences = _context5.sent;

                ctx.body = _template2.default.render('app.scenario.differences', { differences: differences, scenario: scenario, global: { title: scenario.name, tabs: _tabs, _id: ctx.params._id, current: "differnces", sub: "Differences", back: '/app/project/' + scenario.project + '/scenarios' } });

              case 7:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function differences(_x5) {
        return _ref5.apply(this, arguments);
      }

      return differences;
    }()
  }, {
    key: 'correlations',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(ctx) {
        var scenario, correlations;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return _Scenario2.default.findById(ctx.params._id);

              case 2:
                scenario = _context6.sent;
                _context6.next = 5;
                return _Correlation2.default.find({ scenario: ctx.params._id });

              case 5:
                correlations = _context6.sent;

                ctx.body = _template2.default.render('app.scenario.correlation', { correlations: correlations, scenario: scenario, global: { title: scenario.name, tabs: _tabs, _id: ctx.params._id, current: "correlations", sub: "Correlations", back: '/app/project/' + scenario.project + '/scenarios' } });

              case 7:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function correlations(_x6) {
        return _ref6.apply(this, arguments);
      }

      return correlations;
    }()
  }]);

  return ScenarioController;
}();

exports.default = new ScenarioController();