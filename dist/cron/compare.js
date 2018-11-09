'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _logger = require('../utility/logger');

var _logger2 = _interopRequireDefault(_logger);

var _Request = require('../models/Request');

var _Request2 = _interopRequireDefault(_Request);

var _Compare = require('../models/Compare');

var _Compare2 = _interopRequireDefault(_Compare);

var _Difference = require('../models/Difference');

var _Difference2 = _interopRequireDefault(_Difference);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ignoredExt = ['css', 'jpeg', 'jpg', 'png', 'js', 'woff2', 'gif', 'PNG', 'JPG', 'JPEG', 'GIF', 'JS', 'GIF', 'woff', 'svg'];
var ignoredUrls = ['www.google-analytics.com', 'www.facebook.com', 'www.fb.com', 'www.youtube.com', 'maps.google.com'];

var Compare = function () {
  function Compare(params) {
    _classCallCheck(this, Compare);

    this.params = params;
    this.runs = params.runs;
    this.comparissions = [];
    this.mismatchedUrls = [];
    this.current = 0;

    this.connect();
  }

  _createClass(Compare, [{
    key: 'connect',
    value: function connect() {
      _mongoose2.default.connect(_config2.default.database.uri, {
        useMongoClient: true
      });
      _mongoose2.default.connection.on('error', _logger2.default.error);
      _mongoose2.default.Promise = global.Promise;
    }
  }, {
    key: 'start',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _this = this;

        var firstRequests, secondRequests, filteredRequets1, filteredRequets2, _loop, i;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _Request2.default.find({ run: this.params.runs[0] }).sort({ sequence: 1 });

              case 2:
                firstRequests = _context.sent;
                _context.next = 5;
                return _Request2.default.find({ run: this.params.runs[1] }).sort({ sequence: 1 });

              case 5:
                secondRequests = _context.sent;

                //filtering urls
                filteredRequets1 = firstRequests.filter(function (req) {
                  var url = req.url;
                  var extension = url.split(/\#|\?/)[0].split('.').pop().trim();
                  return ignoredExt.indexOf(extension) === -1;
                });
                // console.log(firstRequests.length,filteredRequets1.length)

                filteredRequets2 = secondRequests.filter(function (req) {
                  var url = req.url;
                  var extension = url.split(/\#|\?/)[0].split('.').pop().trim();
                  return ignoredExt.indexOf(extension) === -1;
                });

                _loop = function _loop(i) {
                  // console.log("count", i ,"request2 length" ,filteredRequets2.length );
                  var urlIndex = filteredRequets2.findIndex(function (req) {
                    return req.url === filteredRequets1[i].url && req.session_sequence.toString() === filteredRequets1[i].session_sequence.toString();
                  });
                  if (urlIndex === -1) {
                    _this.mismatchedUrls.push({
                      session_sequence: filteredRequets1[i].session_sequence,
                      request: filteredRequets1[i]._id,
                      url: filteredRequets1[i].request.url,
                      runs: _this.params.runs
                    });
                  } else {
                    var _comparissions;

                    var diff = _this._diff(filteredRequets1[i], filteredRequets2[urlIndex]);
                    if (diff) (_comparissions = _this.comparissions).push.apply(_comparissions, _toConsumableArray(diff));
                    filteredRequets2.splice(urlIndex, 1);
                  }
                };

                for (i = 0; i < filteredRequets1.length; i++) {
                  _loop(i);
                }
                process.send({
                  mismatchUrls: this.mismatchedUrls,
                  comparissions: this.comparissions,
                  compare: this.params
                });

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function start() {
        return _ref.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: '_getDiff',
    value: function _getDiff(r1, r2, type, obj) {
      var temp = [];
      for (var prop in r1) {
        if (r2.hasOwnProperty(prop)) {
          if (r1[prop] !== r2[prop]) {
            obj.key = prop;
            obj.first.value = r1[prop];
            obj.second.value = r2[prop];
            obj.location = type;
            var t = Object.assign({}, obj);
            temp.push(t);
          }
        } else {
          obj.key = prop;
          obj.first.value = r1[prop];
          obj.second.value = "";
          obj.location = type;
          var _t = Object.assign({}, obj);
          temp.push(_t);
        }
      }
      return temp;
    }
  }, {
    key: '_diff',
    value: function _diff(r1, r2) {
      var temp = [];
      var headers = this._parse([r1.request.headers, r2.request.headers]);
      var cookies = this._parse([r1.request.cookies, r2.request.cookies]);
      var postParams = this._parse([r1.request.post_data, r2.request.post_data]);
      var queryParams = this._parse([r1.request.params, r2.request.params]);
      var obj = {
        url: r1.url,
        sequence: r1.sequence,
        location: '',
        key: '',
        first: {
          value: '',
          request: r1._id,
          run: r1.run
        },
        second: {
          value: '',
          request: r2._id,
          run: r2.run
        },
        scenario: r1.scenario,
        session_sequence: r1.session_sequence,
        session: r1.session
      };
      if (headers[0] && headers[1]) {
        temp.push.apply(temp, _toConsumableArray(this._getDiff(headers[0], headers[1], "header", obj)));
      }
      if (cookies[0] && cookies[1]) {
        temp.push.apply(temp, _toConsumableArray(this._getDiff(cookies[0], cookies[1], "cookie", obj)));
      }
      if (postParams[0] && postParams[1]) {
        temp.push.apply(temp, _toConsumableArray(this._getDiff(postParams[0], postParams[1], "post_data", obj)));
      }
      if (queryParams[0] && queryParams[1]) {
        temp.push.apply(temp, _toConsumableArray(this._getDiff(queryParams[0], queryParams[1], "params", obj)));
      }

      if (r1.request.url !== r2.request.url) {
        temp.push({
          url: r1.url,
          sequence: r1.sequence,
          location: 'url',
          key: 'url',
          first: {
            value: r1.request.url,
            request: r1._id,
            run: r1.run
          },
          second: {
            value: r2.request.url,
            request: r2._id,
            run: r2.run
          },
          scenario: r1.scenario,
          session_sequence: r1.session_sequence,
          session: r1.session
        });
      }
      return temp;
    }
  }, {
    key: '_parse',
    value: function _parse(params) {
      var parsed = [];
      params.forEach(function (param, index) {
        var temp = {};
        var flag = false;
        if (param && Array.isArray(param) && param.length > 0) {
          param.forEach(function (p) {
            Object.keys(p).forEach(function (key) {
              flag = true;
              temp[key] = p[key];
            });
          });
        }
        if (flag) parsed.push(temp);
      });
      return parsed;
    }
  }]);

  return Compare;
}();

process.on('message', function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(params) {
    var compare;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            compare = new Compare(params);
            _context2.next = 3;
            return compare.start();

          case 3:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x) {
    return _ref2.apply(this, arguments);
  };
}());