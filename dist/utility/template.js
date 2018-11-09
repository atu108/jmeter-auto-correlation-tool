'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _edge = require('edge.js');

var _edge2 = _interopRequireDefault(_edge);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _helper = require('./helper');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var view = _path2.default.join(__dirname, '../view');
var _globals = {
  header: true,
  footer: true
};

var Template = function () {
  function Template() {
    _classCallCheck(this, Template);

    _edge2.default.registerViews(view);
    _edge2.default.global('stringify', function (data) {
      return JSON.stringify(data);
    });
    _edge2.default.global('title', function (title) {
      return title.toLowerCase().replace(/ /g, "-").replace(/\&/g, 'and');
    });

    _edge2.default.global('date', function (date) {
      var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'MMM Do YY, HH:mm';

      return (0, _moment2.default)(new Date(date)).format(format);
    });

    _edge2.default.global("ceil", function (num) {
      return Math.ceil(num);
    });

    _edge2.default.global("pad", _helper.pad);
  }

  _createClass(Template, [{
    key: 'render',
    value: function render(name) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


      _edge2.default.global('global', Object.assign({}, _globals, data.global, {
        authUser: _edge2.default._globals.authUser
      }));
      delete data.global;

      return _edge2.default.render(name, data);
    }
  }]);

  return Template;
}();

exports.default = new Template();