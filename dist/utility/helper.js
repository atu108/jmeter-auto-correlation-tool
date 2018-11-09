'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.removeDir = exports.filesInDir = exports.request = exports.pad = exports.to = exports.encrypt = exports.errorMessages = exports.responses = undefined;
exports.id = id;
exports.isValidMongoDBObjectId = isValidMongoDBObjectId;
exports.logInfo = logInfo;

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _fs = require('fs');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function id() {
  return Math.random().toString(13).replace('0.', '');
}

var responses = exports.responses = {
  200: {
    type: 'success',
    code: 200,
    status: 'ok',
    message: 'The request has succeeded.'
  },
  204: {
    type: 'success',
    code: 204,
    status: 'No Content',
    message: 'No response body to send.'
  },
  400: {
    type: 'error',
    code: 400,
    status: 'Bad Request'
  },
  401: {
    type: 'error',
    code: 401,
    status: 'Unauthorized',
    message: 'Authentication credentials are missing or invalid.'
  },
  403: {
    type: 'error',
    code: 403,
    status: 'Forbidden',
    message: 'The server understood the request but refuses to authorize it.'
  },
  404: {
    type: 'error',
    code: 404,
    status: 'Not Found',
    message: 'The requested URL or Resource is not found.'
  },
  405: {
    type: 'error',
    code: 405,
    status: 'Method Not Allowed',
    message: 'The requested method is not allowed.'
  },
  406: {
    type: 'error',
    code: 406,
    status: 'Not Acceptable',
    message: 'The request has missing file.'
  },
  415: {
    type: 'error',
    code: 415,
    status: 'Unsupported Media Type',
    message: 'The supported media types are JPG,JPEG,PNG.'
  },
  500: {
    type: 'error',
    code: 500,
    status: 'Internal Server Error',
    message: 'The server encountered an unexpected condition that prevented it from fulfilling the request.'
  }
};

var errorMessages = exports.errorMessages = {
  MISSING: "One or more required parameters are missing.",
  INVALID_LOGIN: "Invalid login credentials.",
  INVALID_TOKEN: "Invalid or expired authorization token."
};

function isValidMongoDBObjectId(str) {
  return str.length === 24 && /^[a-f\d]{24}$/i.test(str);
}

var time = function time(start) {
  var delta = Date.now() - start;
  return delta < 10000 ? delta + 'ms' : Math.round(delta / 1000) + 's';
};

function logInfo(start, ctx, logger) {
  var res = ctx.res;

  var onFinish = done.bind(null, 'finish');
  var onClose = done.bind(null, 'finish');

  res.once('finish', onFinish);
  res.once('close', onClose);

  function done(event) {
    res.removeListener('finish', onFinish);
    res.removeListener('close', onClose);

    var resp = responses[ctx.status];

    if (!resp || ctx.originalUrl.indexOf("/dist/") !== -1 && ctx.status === 200) return;

    var upstream = resp.type == "error" ? 'xxx' : event === 'close' ? '-x-' : '-->';
    logger.info(upstream + ' ' + ctx.method + ' ' + ctx.originalUrl + ' ' + ctx.status + ' ' + time(start));
  }
}

var encrypt = exports.encrypt = function encrypt(password) {
  var hash = _crypto2.default.createHmac('sha512', _config2.default.app.secret);
  hash.update(password);
  return hash.digest('hex');
};

var to = exports.to = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(promise) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', promise.then(function (data) {
              return [data, null];
            }).catch(function (err) {
              return [null, err];
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function to(_x) {
    return _ref.apply(this, arguments);
  };
}();

var pad = exports.pad = function pad(input, length) {
  var char = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  return (Array(length + 1).join(char) + input).slice(-length);
};

var request = exports.request = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(url, params) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt('return', (0, _isomorphicFetch2.default)(url, params));

          case 1:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function request(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

var filesInDir = exports.filesInDir = function filesInDir(path) {
  var files = (0, _fs.readdirSync)(path);
  var fileList = [];
  files.forEach(function (file) {
    fileList.push(path + "/" + file);
  });
  console.log(fileList);
  return fileList;
};

var removeDir = exports.removeDir = function removeDir(dir, cb) {
  return (0, _rimraf2.default)(dir, cb);
};