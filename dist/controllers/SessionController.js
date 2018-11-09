'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
// import config from "../../../jmx-generator/server/config";


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

var _Request = require('../models/Request');

var _Request2 = _interopRequireDefault(_Request);

var _Session = require('../models/Session');

var _Session2 = _interopRequireDefault(_Session);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _Difference = require('../models/Difference');

var _Difference2 = _interopRequireDefault(_Difference);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// const _tabs = [{
//   label: "Runs",
//   action: "runs",
//   controller: "scenario"
// }, {
//   label: "Steps",
//   action: "steps",
//   controller: "scenario"
// }, {
//   label: "Differences",
//   action: "differnces",
//   controller: "scenario"
// }, {
//   label: "Corelations",
//   action: "corelations",
//   controller: "scenario"
// }];

var SessionController = function () {
  function SessionController() {
    _classCallCheck(this, SessionController);

    return {
      find: this.find.bind(this),
      delete: this.delete.bind(this),
      save: this.save.bind(this)
    };
  }

  _createClass(SessionController, [{
    key: 'find',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx) {
        var sessions;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _Session2.default.find({ run: ctx.params._id });

              case 2:
                sessions = _context.sent;

                ctx.body = _template2.default.render(''); //to find and populate the saved hars

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function find(_x) {
        return _ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'delete',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(ctx) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return _Session2.default.delete({ _id: session_id });

              case 2:
                ctx.body = JSON.stringify({
                  type: "success",
                  message: "Deleted successfully, reloading...",
                  reload: true
                });

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _delete(_x2) {
        return _ref2.apply(this, arguments);
      }

      return _delete;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(ctx) {
        var _this = this;

        var run_id, lastStepSequence, readStream, session, finalData;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                run_id = ctx.request.body.fields.run;
                _context3.next = 3;
                return _Request2.default.find({ run: run_id }).count();

              case 3:
                lastStepSequence = _context3.sent;

                // const scenario = await Scenario.findById(ctx.params._id);
                readStream = void 0;

                try {
                  readStream = JSON.parse(_fs2.default.readFileSync(ctx.request.body.files.file.path));
                } catch (e) {
                  if (e) {
                    console.log("error", e);
                  }
                }
                _context3.next = 8;
                return _Session2.default.create(ctx.request.body.fields);

              case 8:
                session = _context3.sent;
                finalData = [];

                console.log(run_id, readStream.log.entries.length);
                readStream.log.entries.forEach(function (entry, index) {
                  var data = { request: {}, response: {} };
                  data.url = entry.request.url.split('?')[0];
                  data.request.method = entry.request.method;
                  data.request.url = entry.request.url;
                  data.request.headers = _this._parse(entry.request.headers);
                  data.request.cookies = _this._parse(entry.request.cookies);
                  data.request.params = entry.request.queryString ? _this._parse(entry.request.queryString) : [];
                  data.request.post_data = entry.request.postData ? _this._parse(entry.request.postData.params ? entry.request.postData.params : [], entry.request.postData.mimeType === 'application/x-www-form-urlencoded') : [];
                  data.response.status = entry.response.status;
                  data.response.headers = _this._parse(entry.response.headers);
                  data.response.cookies = _this._parse(entry.response.cookies);
                  data.response.body = entry.response.content.text;
                  data.run = ctx.request.body.fields.run;
                  data.session = session._id;
                  data.scenario = ctx.request.body.fields.scenario;
                  data.session_sequence = session.sequence;
                  data.sequence = lastStepSequence + index + 1;
                  finalData.push(data);
                });
                _context3.next = 14;
                return _Request2.default.create(finalData);

              case 14:
                return _context3.abrupt('return', ctx.body = {
                  type: "success",
                  message: "Session saved, reloading...",
                  reload: true
                });

              case 15:
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
    key: '_parse',
    value: function _parse(arr, isEncoded) {
      var temp = [];
      arr.forEach(function (obj) {
        var test = {};
        var name = obj['name'].indexOf('.') !== -1 ? obj['name'].split(".").join("U+FF0E") : obj['name'];
        var value = obj['value'];
        if (isEncoded) {
          value = decodeURIComponent(value);
          name = decodeURIComponent(name);
          test[name] = value;
          temp.push(test);
        } else {
          test[name] = value;
          temp.push(test);
        }
      });
      return temp;
    }
  }]);

  return SessionController;
}();

exports.default = new SessionController();