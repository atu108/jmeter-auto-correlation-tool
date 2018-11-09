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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _tabs = [{
  label: "Scenarios",
  action: "scenarios",
  controller: "project"
}, {
  label: "Reports",
  action: "reports",
  controller: "project"
}, {
  label: "Settings",
  action: "settings",
  controller: "project"
}];

var ProjectController = function () {
  function ProjectController() {
    _classCallCheck(this, ProjectController);

    return {
      index: this.index.bind(this),
      scenarios: this.scenarios.bind(this),
      save: this.save.bind(this)
    };
  }

  _createClass(ProjectController, [{
    key: 'index',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx) {
        var projects;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _Project2.default.find({ owner: ctx.session.user._id });

              case 2:
                projects = _context.sent;

                ctx.body = _template2.default.render('app.project.index', { projects: projects, global: { title: "Projects", user: ctx.session.user } });

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function index(_x) {
        return _ref.apply(this, arguments);
      }

      return index;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(ctx) {
        var _ctx$request$body, title, url, description, owner, status;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _ctx$request$body = ctx.request.body, title = _ctx$request$body.title, url = _ctx$request$body.url, description = _ctx$request$body.description;
                owner = ctx.session.user._id;
                status = true;
                _context2.next = 5;
                return _Project2.default.create({ title: title, owner: owner, url: url, description: description, status: status });

              case 5:
                ctx.body = JSON.stringify({
                  type: "success",
                  message: "Project saved, reloading...",
                  reload: true
                });

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function save(_x2) {
        return _ref2.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'scenarios',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(ctx) {
        var project, scenarios;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return _Project2.default.findById(ctx.params._id);

              case 2:
                project = _context3.sent;
                _context3.next = 5;
                return _Scenario2.default.find({ project: ctx.params._id });

              case 5:
                scenarios = _context3.sent;

                ctx.body = _template2.default.render('app.project.scenarios', { scenarios: scenarios, project: project, global: { title: project.title, tabs: _tabs, current: "scenarios", _id: ctx.params._id, sub: 'Scenarios', back: '/app/projects' } });

              case 7:
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
  }]);

  return ProjectController;
}();

exports.default = new ProjectController();