'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (dirname) {
  return new Promise(function (resolve, reject) {
    var routes = [];
    (0, _glob2.default)(dirname + '/*', {
      ignore: '**/index.js'
    }, function (err, files) {
      if (err) {
        return reject(err);
      }
      files.forEach(function (file) {
        var route = require(file); // eslint-disable-line global-require, import/no-dynamic-require, max-len
        routes.push(route);
      });
      return resolve(routes);
    });
  });
};

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }