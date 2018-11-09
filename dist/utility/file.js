'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('babel-polyfill');

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _sharp = require('sharp');

var _sharp2 = _interopRequireDefault(_sharp);

var _readChunk = require('read-chunk');

var _readChunk2 = _interopRequireDefault(_readChunk);

var _fileType = require('file-type');

var _fileType2 = _interopRequireDefault(_fileType);

var _fluentFfmpeg = require('fluent-ffmpeg');

var _fluentFfmpeg2 = _interopRequireDefault(_fluentFfmpeg);

var _es6Promisify = require('es6-promisify');

var _es6Promisify2 = _interopRequireDefault(_es6Promisify);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _helper = require('./helper');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var File = function () {
  function File() {
    _classCallCheck(this, File);

    return {
      save: this.save.bind(this),
      get: this.get.bind(this),
      info: this.info.bind(this),
      delete: this.delete.bind(this),
      deleteFiles: this.deleteFiles.bind(this)
    };
  }

  _createClass(File, [{
    key: 'save',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(file, params) {
        var info;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.info(file);

              case 2:
                info = _context.sent;

                if (!(_config2.default.storage.mime.image.indexOf(info.mime) === -1 && _config2.default.storage.mime.video.indexOf(info.mime) === -1)) {
                  _context.next = 5;
                  break;
                }

                return _context.abrupt('return', _helper.responses[415]);

              case 5:
                _context.next = 7;
                return this._save(file, info, params);

              case 7:
                return _context.abrupt('return', _context.sent);

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function save(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: '_save',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(file, info, params) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(_config2.default.storage.default === 'file')) {
                  _context2.next = 6;
                  break;
                }

                _context2.next = 3;
                return this._saveFile(file, info, params);

              case 3:
                return _context2.abrupt('return', _context2.sent);

              case 6:
                if (!(_config2.default.storage.default === 's3')) {
                  _context2.next = 10;
                  break;
                }

                _context2.next = 9;
                return this._saveS3(file, info, params);

              case 9:
                return _context2.abrupt('return', _context2.sent);

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _save(_x3, _x4, _x5) {
        return _ref2.apply(this, arguments);
      }

      return _save;
    }()
  }, {
    key: '_saveS3',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(file, info) {
        var savePath, name, iBucket;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                savePath = this._getPath('s3');
                name = this._name();
                iBucket = new AWS.S3({ params: { Bucket: _config2.default.storage.s3.bucket } });
                return _context3.abrupt('return', {
                  name: name
                });

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _saveS3(_x6, _x7) {
        return _ref3.apply(this, arguments);
      }

      return _saveS3;
    }()
  }, {
    key: '_saveFile',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(file, info, params) {
        var name, meta, saved;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                name = this._name();
                meta = {};

                if (!(_config2.default.storage.mime.image.indexOf(info.mime) !== -1)) {
                  _context4.next = 9;
                  break;
                }

                info.type = 'image';
                name = name + '.jpeg';
                _context4.next = 7;
                return this._saveImage(file, name, params);

              case 7:
                saved = _context4.sent;


                meta = {
                  mime: 'image/jpeg',
                  size: saved.size,
                  width: saved.width,
                  height: saved.height
                };

              case 9:
                return _context4.abrupt('return', {
                  name: name,
                  type: info.type,
                  meta: meta
                });

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _saveFile(_x8, _x9, _x10) {
        return _ref4.apply(this, arguments);
      }

      return _saveFile;
    }()
  }, {
    key: 'deleteFiles',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(files) {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                files.forEach(function (p) {
                  var file = _path2.default.join(_config2.default.storage.file.path, 'main', p);

                  if (_fs2.default.existsSync(file)) _fs2.default.unlink(file, function (result) {
                    console.log(result);
                  });

                  file = _path2.default.join(_config2.default.storage.file.path, 'thumb', p);

                  if (_fs2.default.existsSync(file)) _fs2.default.unlink(file, function (result) {
                    console.log(result);
                  });
                });

              case 1:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function deleteFiles(_x11) {
        return _ref5.apply(this, arguments);
      }

      return deleteFiles;
    }()
  }, {
    key: 'delete',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(path) {
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                path.forEach(function (p) {
                  if (_fs2.default.existsSync(p)) _fs2.default.unlink(p, function (result) {
                    console.log(result);
                  });
                });

              case 1:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function _delete(_x12) {
        return _ref6.apply(this, arguments);
      }

      return _delete;
    }()
  }, {
    key: 'get',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(path) {
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (!_fs2.default.existsSync(path)) {
                  _context7.next = 4;
                  break;
                }

                _context7.next = 3;
                return _fs2.default.createReadStream(path);

              case 3:
                return _context7.abrupt('return', _context7.sent);

              case 4:
                return _context7.abrupt('return', _helper.responses[404]);

              case 5:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function get(_x13) {
        return _ref7.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: 'info',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(file) {
        var part;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return _readChunk2.default.sync(file.path, 0, 4000);

              case 2:
                part = _context8.sent;
                return _context8.abrupt('return', (0, _fileType2.default)(part));

              case 4:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function info(_x14) {
        return _ref8.apply(this, arguments);
      }

      return info;
    }()
  }, {
    key: '_name',
    value: function _name() {
      return _crypto2.default.randomBytes(20).toString('hex');
    }
  }, {
    key: '_getPath',
    value: function _getPath(type) {
      var savePath = {
        file: {
          main: _path2.default.join(_config2.default.storage.file.path, 'main'),
          thumb: _path2.default.join(_config2.default.storage.file.path, 'thumb'),
          content: _path2.default.join(_config2.default.storage.file.path, 'content')
        },
        s3: {
          display: '/main',
          thumb: '/thumb',
          content: '/content'
        }
      };
      return savePath[type];
    }
  }, {
    key: '_saveImage',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(file, name, params) {
        var savePath, buffer, newBuffer;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                savePath = this._getPath('file');
                buffer = (0, _sharp2.default)(file.path);
                newBuffer = false;

                if (!(params.type === 'content')) {
                  _context9.next = 9;
                  break;
                }

                _context9.next = 6;
                return buffer.jpeg({
                  quality: 100
                }).resize(params.width).toFile(_path2.default.join(savePath.content, name));

              case 6:
                newBuffer = _context9.sent;
                _context9.next = 14;
                break;

              case 9:
                _context9.next = 11;
                return buffer.jpeg({
                  quality: 100
                }).resize(1920).toFile(_path2.default.join(savePath.main, name));

              case 11:
                newBuffer = _context9.sent;
                _context9.next = 14;
                return buffer.resize(500).jpeg({
                  quality: 100
                }).toFile(_path2.default.join(savePath.thumb, name));

              case 14:
                return _context9.abrupt('return', newBuffer);

              case 15:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function _saveImage(_x15, _x16, _x17) {
        return _ref9.apply(this, arguments);
      }

      return _saveImage;
    }()
  }, {
    key: '_saveVideo',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(file, name) {
        var savePath;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                savePath = this._getPath('file');
                return _context10.abrupt('return', (0, _fluentFfmpeg2.default)(file.path).format('mp4').screenshot({
                  count: 1,
                  folder: savePath.thumb,
                  filename: name + '.jpeg',
                  size: '500x?'
                }).output(_path2.default.join(savePath.display, name + '.mp4')));

              case 2:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function _saveVideo(_x18, _x19) {
        return _ref10.apply(this, arguments);
      }

      return _saveVideo;
    }()
  }]);

  return File;
}();

exports.default = new File();