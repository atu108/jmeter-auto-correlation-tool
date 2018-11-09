'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('babel-polyfill');

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _Step = require('../models/Step');

var _Step2 = _interopRequireDefault(_Step);

var _ComparedObjects = require('../models/ComparedObjects');

var _ComparedObjects2 = _interopRequireDefault(_ComparedObjects);

var _Session = require('../models/Session');

var _Session2 = _interopRequireDefault(_Session);

var _url = require('url');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_mongoose2.default.connect(_config2.default.database.uri, {
    useMongoClient: true
});
_mongoose2.default.connection.on('error', console.error);
_mongoose2.default.Promise = global.Promise;

var BackTrack = function () {
    function BackTrack(body) {
        _classCallCheck(this, BackTrack);

        return this.start(body);
    }

    _createClass(BackTrack, [{
        key: 'start',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(body) {
                var _this = this;

                var temp, comparedObjects, loopTimes, _loop, i, data;

                return regeneratorRuntime.wrap(function _callee$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                temp = [];
                                _context2.next = 3;
                                return _ComparedObjects2.default.find({ _id: { $in: body.compareIds } });

                            case 3:
                                comparedObjects = _context2.sent;
                                loopTimes = comparedObjects.length;
                                _loop = /*#__PURE__*/regeneratorRuntime.mark(function _loop(i) {
                                    var key, values, stepSequenceRun1, stepSequenceRun2, map, locationValue, backtrackedValue;
                                    return regeneratorRuntime.wrap(function _loop$(_context) {
                                        while (1) {
                                            switch (_context.prev = _context.next) {
                                                case 0:
                                                    key = comparedObjects[i].key;
                                                    values = comparedObjects[i].values.map(function (value) {
                                                        return value.replace('+', ' ');
                                                    });
                                                    _context.next = 4;
                                                    return _Step2.default.find({ _id: comparedObjects[i].step_ids[0] }, 'step_sequence');

                                                case 4:
                                                    stepSequenceRun1 = _context.sent;
                                                    _context.next = 7;
                                                    return _Step2.default.find({ _id: comparedObjects[i].step_ids[1] }, 'step_sequence');

                                                case 7:
                                                    stepSequenceRun2 = _context.sent;
                                                    map = {
                                                        1: function () {
                                                            return this._searchInHeader(comparedObjects[i], key, values, [stepSequenceRun1[0].step_sequence, stepSequenceRun2[0].step_sequence]);
                                                        }.bind(_this)(),
                                                        2: function () {
                                                            return this._searchInCookies(comparedObjects[i], key, values, [stepSequenceRun1[0].step_sequence, stepSequenceRun2[0].step_sequence]);
                                                        }.bind(_this)()
                                                    };
                                                    locationValue = comparedObjects[i].location === 'headers' ? 1 : comparedObjects[i].location === 'cookies' ? 2 : null;
                                                    _context.next = 12;
                                                    return map[locationValue];

                                                case 12:
                                                    backtrackedValue = _context.sent;
                                                    _context.t0 = temp;
                                                    _context.t1 = backtrackedValue;

                                                    if (_context.t1) {
                                                        _context.next = 19;
                                                        break;
                                                    }

                                                    _context.next = 18;
                                                    return map[3 - locationValue];

                                                case 18:
                                                    _context.t1 = _context.sent;

                                                case 19:
                                                    if (!_context.t1) {
                                                        _context.next = 25;
                                                        break;
                                                    }

                                                    _context.next = 22;
                                                    return map[3 - locationValue];

                                                case 22:
                                                    _context.t2 = _context.sent;
                                                    _context.next = 28;
                                                    break;

                                                case 25:
                                                    _context.next = 27;
                                                    return _this._searchInBody(comparedObjects[i], key, values, [stepSequenceRun1[0].step_sequence, stepSequenceRun2[0].step_sequence]);

                                                case 27:
                                                    _context.t2 = _context.sent;

                                                case 28:
                                                    _context.t3 = _context.t2;

                                                    _context.t0.push.call(_context.t0, _context.t3);

                                                case 30:
                                                case 'end':
                                                    return _context.stop();
                                            }
                                        }
                                    }, _loop, _this);
                                });
                                i = 0;

                            case 7:
                                if (!(i < loopTimes)) {
                                    _context2.next = 12;
                                    break;
                                }

                                return _context2.delegateYield(_loop(i), 't0', 9);

                            case 9:
                                i++;
                                _context2.next = 7;
                                break;

                            case 12:
                                data = temp.filter(function (obj) {
                                    return obj !== null;
                                });

                                process.send({
                                    backtrack_id: body.backtrack_id,
                                    data: data
                                });

                            case 14:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee, this);
            }));

            function start(_x) {
                return _ref.apply(this, arguments);
            }

            return start;
        }()
    }, {
        key: '_searchInHeader',
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(obj, key, values, stepSequences) {
                var priority, found, temp, file_details;
                return regeneratorRuntime.wrap(function _callee2$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                priority = 3;
                                _context3.next = 3;
                                return _Step2.default.find({
                                    run_id: obj.run_ids[0],
                                    step_sequence: { $lt: stepSequences[0] },
                                    'response.headers': _defineProperty({}, key, values[0])
                                }, ['response.headers.' + key, 'url', 'session_id']).sort({ step_sequence: -1 });

                            case 3:
                                found = _context3.sent;

                                if (!(found.length < 1)) {
                                    _context3.next = 6;
                                    break;
                                }

                                return _context3.abrupt('return', null);

                            case 6:
                                temp = found[0];
                                _context3.next = 9;
                                return this._whichFile(temp.session_id);

                            case 9:
                                file_details = _context3.sent;
                                return _context3.abrupt('return', {
                                    compare_id: obj._id,
                                    compared_url: obj.url,
                                    url: temp.url,
                                    file_run1: file_details.file,
                                    file_sequence_run1: file_details.sequence,
                                    location: 'headers',
                                    priority: priority,
                                    matched_string: key + ':' + values[0],
                                    reg: 'NA',
                                    session_id: temp.session_id,
                                    step_id: temp._id,
                                    run_ids: obj.run_ids,
                                    exists_in_other_run: 'NA',
                                    final_regex: 'NA'
                                });

                            case 11:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function _searchInHeader(_x2, _x3, _x4, _x5) {
                return _ref2.apply(this, arguments);
            }

            return _searchInHeader;
        }()
    }, {
        key: '_searchInCookies',
        value: function () {
            var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(obj, key, values, stepSequences) {
                var priority, found, temp, file_details;
                return regeneratorRuntime.wrap(function _callee3$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                priority = 3;
                                _context4.next = 3;
                                return _Step2.default.find({
                                    run_id: obj.run_ids[0],
                                    step_sequence: { $lt: stepSequences[0] },
                                    'response.cookies': _defineProperty({}, key, values[0])
                                }, ['response.cookies.' + key, 'url', 'session_id']).sort({ step_sequence: -1 });

                            case 3:
                                found = _context4.sent;

                                if (!(found.length < 1)) {
                                    _context4.next = 6;
                                    break;
                                }

                                return _context4.abrupt('return', null);

                            case 6:
                                temp = found[0];
                                _context4.next = 9;
                                return this._whichFile(temp.session_id);

                            case 9:
                                file_details = _context4.sent;
                                return _context4.abrupt('return', {
                                    compare_id: obj._id,
                                    compared_url: obj.url,
                                    url: temp.url,
                                    file_run1: file_details.file,
                                    file_sequence_run1: file_details.sequence,
                                    location: 'cookies',
                                    priority: priority,
                                    matched_string: key + ':' + values[0],
                                    reg: 'NA',
                                    session_id: temp.session_id,
                                    step_id: temp._id,
                                    run_ids: obj.run_ids,
                                    exists_in_other_run: 'NA',
                                    final_regex: 'NA'
                                });

                            case 11:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function _searchInCookies(_x6, _x7, _x8, _x9) {
                return _ref3.apply(this, arguments);
            }

            return _searchInCookies;
        }()
    }, {
        key: '_searchInBody',
        value: function () {
            var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(obj, key, values, stepSequences) {
                var priority, regStr1, regStr2, reg, reg2, matchedString, session_detail_run1, matchedInOtherRun, r1, r2, matched, matchedOtherRun, finalReg, session_detail_run2, regArr, regArr1, i, _reg, reg1, _matchedString, _session_detail_run, _matchedInOtherRun, _matched, _matchedOtherRun, _finalReg2, _session_detail_run2;

                return regeneratorRuntime.wrap(function _callee4$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                priority = 1;
                                regStr1 = '';
                                regStr2 = '';

                                if (!(obj.location === 'url')) {
                                    _context5.next = 36;
                                    break;
                                }

                                regStr1 = '<(.*?)' + values[0].replace('?', '\\?') + '(.*?)>';
                                regStr2 = '<(.*?)' + values[1].replace('?', '\\?') + '(.*?)>';
                                reg = new RegExp(regStr1, 'i');
                                reg2 = new RegExp(regStr2, 'i');
                                _context5.next = 10;
                                return _Step2.default.find({
                                    run_id: obj.run_ids[0],
                                    step_sequence: { $lt: stepSequences[0] },
                                    'response.body': reg
                                }).sort({ step_sequence: -1 });

                            case 10:
                                matchedString = _context5.sent;

                                if (!(matchedString.length < 1)) {
                                    _context5.next = 13;
                                    break;
                                }

                                return _context5.abrupt('return', null);

                            case 13:
                                _context5.next = 15;
                                return this._whichFile(matchedString[0].session_id);

                            case 15:
                                session_detail_run1 = _context5.sent;
                                _context5.next = 18;
                                return _Step2.default.find({
                                    run_id: obj.run_ids[1],
                                    session_sequence: session_detail_run1.sequence,
                                    'response.body': reg2
                                }).sort({ step_sequence: -1 });

                            case 18:
                                matchedInOtherRun = _context5.sent;
                                r1 = new RegExp('(.[^<]*?)' + values[0].replace('?', '\\?') + '(.*?)>{1}', 'i');
                                r2 = new RegExp('(.[^<]*?)' + values[1].replace('?', '\\?') + '(.*?)>{1}', 'i');
                                matched = matchedString[0].response.body.match(r1);
                                matchedOtherRun = matchedInOtherRun.length > 0 ? matchedInOtherRun[0].response.body.match(r2) : 'NA';
                                finalReg = '';

                                if (matchedOtherRun !== 'NA') {
                                    finalReg = this._finalReg(matched, matchedOtherRun, values, key, 'url');
                                }

                                if (!(matchedInOtherRun.length > 0)) {
                                    _context5.next = 31;
                                    break;
                                }

                                _context5.next = 28;
                                return this._whichFile(matchedInOtherRun[0].session_id);

                            case 28:
                                _context5.t0 = _context5.sent;
                                _context5.next = 34;
                                break;

                            case 31:
                                _context5.next = 33;
                                return this._whichFile(false);

                            case 33:
                                _context5.t0 = _context5.sent;

                            case 34:
                                session_detail_run2 = _context5.t0;
                                return _context5.abrupt('return', {
                                    compare_id: obj._id,
                                    compared_url: obj.url,
                                    key: key,
                                    url: matchedString[0].url,
                                    file_run1: session_detail_run1.file,
                                    file_sequence_run1: session_detail_run1.sequence,
                                    location: 'url found in body',
                                    priority: priority,
                                    matched_string: finalReg.hasOwnProperty('pos1') ? matched[finalReg['pos1']] : matched.join('||'),
                                    regCount: finalReg.hasOwnProperty('reg') ? this._countReg(finalReg['reg']) : 'NA',
                                    reg: regStr1,
                                    session_id: matchedString[0].session_id,
                                    step_id: matchedString[0]._id,
                                    run_ids: obj.run_ids,
                                    url2: matchedInOtherRun[0] ? matchedInOtherRun[0].url : 'NA',
                                    file_run2: session_detail_run2.file,
                                    file_sequence_run2: session_detail_run2.sequence,
                                    exists_in_other_run: finalReg.hasOwnProperty('pos2') ? matchedOtherRun[finalReg['pos2']] : matchedOtherRun !== 'NA' ? matchedOtherRun.join('||') : 'NA',
                                    final_regex: finalReg.hasOwnProperty('reg') ? finalReg['reg'] : false
                                });

                            case 36:
                                key = key.split('U+FF0E').join('.');
                                regArr = ['<(.*?)' + key + '=' + values[0] + '(.*?)>', '<(.*?)' + key + '(.[^<]*?)' + values[0] + '(.*?)>', '<(.*?)' + values[0] + '(.[^<]*?)' + key + '(.*?)>'];
                                regArr1 = ['<(.*?)' + key + '=' + values[1] + '(.*?)>', '<(.*?)' + key + '(.[^<]*?)' + values[1] + '(.*?)>', '<(.*?)' + values[1] + '(.[^<]*?)' + key + '(.*?)>'];
                                i = 0;

                            case 40:
                                if (!(i < regArr.length)) {
                                    _context5.next = 72;
                                    break;
                                }

                                _reg = new RegExp(regArr[i], 'i');
                                reg1 = new RegExp(regArr1[i], 'i');
                                _context5.next = 45;
                                return _Step2.default.find({
                                    run_id: obj.run_ids[0],
                                    step_sequence: { $lt: stepSequences[0] },
                                    'response.body': _reg
                                }).sort({ step_sequence: -1 });

                            case 45:
                                _matchedString = _context5.sent;

                                if (!(_matchedString.length < 1)) {
                                    _context5.next = 48;
                                    break;
                                }

                                return _context5.abrupt('continue', 69);

                            case 48:
                                _context5.next = 50;
                                return this._whichFile(_matchedString[0].session_id);

                            case 50:
                                _session_detail_run = _context5.sent;
                                _context5.next = 53;
                                return _Step2.default.find({
                                    run_id: obj.run_ids[1],
                                    session_sequence: { $lte: _session_detail_run.sequence },
                                    'response.body': reg1
                                }).sort({ step_sequence: -1 });

                            case 53:
                                _matchedInOtherRun = _context5.sent;
                                _matched = _matchedString[0].response.body.match(new RegExp(regArr[i].replace('<(.*?)', '(.[^<]*?)').replace('(.*?)>', '(.*?)>{1}'), 'gi'));
                                _matchedOtherRun = _matchedInOtherRun.length > 0 ? _matchedInOtherRun[0].response.body.match(new RegExp(regArr1[i].replace('<(.*?)', '(.[^<]*?)').replace('(.*?)>', '(.*?)>{1}'), 'gi')) : 'NA';
                                // console.log(matched,"||||||||||||",matchedOtherRun);

                                _finalReg2 = {};


                                if (_matchedOtherRun !== 'NA') {
                                    _finalReg2 = this._finalReg(_matched, _matchedOtherRun, values, key, i);
                                }

                                if (!(_matchedInOtherRun.length > 0)) {
                                    _context5.next = 64;
                                    break;
                                }

                                _context5.next = 61;
                                return this._whichFile(_matchedInOtherRun[0].session_id);

                            case 61:
                                _context5.t1 = _context5.sent;
                                _context5.next = 67;
                                break;

                            case 64:
                                _context5.next = 66;
                                return this._whichFile(false);

                            case 66:
                                _context5.t1 = _context5.sent;

                            case 67:
                                _session_detail_run2 = _context5.t1;
                                return _context5.abrupt('return', {
                                    compare_id: obj._id,
                                    compared_url: obj.url,
                                    key: key,
                                    url: _matchedString[0].url,
                                    file_run1: _session_detail_run.file,
                                    file_sequence_run1: _session_detail_run.sequence,
                                    location: 'body',
                                    priority: priority,
                                    matched_string: _finalReg2.hasOwnProperty('pos1') ? _matched[_finalReg2['pos1']] : _matched.join('||'),
                                    regCount: _finalReg2.hasOwnProperty('reg') ? this._countReg(_finalReg2['reg']) : 'NA',
                                    reg: regArr[i],
                                    session_id: _matchedString[0].session_id,
                                    step_id: _matchedString[0]._id,
                                    run_ids: obj.run_ids,
                                    url2: _matchedInOtherRun[0] ? _matchedInOtherRun[0].url : 'NA',
                                    file_run2: _session_detail_run2.file,
                                    file_sequence_run2: _session_detail_run2.sequence,
                                    exists_in_other_run: _finalReg2.hasOwnProperty('pos2') ? _matchedOtherRun[_finalReg2['pos2']] : _matchedOtherRun !== 'NA' ? _matchedOtherRun.join('||') : 'NA',
                                    final_regex: _finalReg2.hasOwnProperty('reg') ? _finalReg2['reg'] : false
                                });

                            case 69:
                                i++;
                                _context5.next = 40;
                                break;

                            case 72:
                                return _context5.abrupt('return', null);

                            case 73:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function _searchInBody(_x10, _x11, _x12, _x13) {
                return _ref4.apply(this, arguments);
            }

            return _searchInBody;
        }()
    }, {
        key: '_countReg',
        value: function _countReg(str) {
            var regcount = '';
            var count = str.split('(.*?)').length;
            for (var i = 1; i < count; i++) {
                regcount += '$' + i + '$';
            }
            return regcount;
        }

        //creates final reg by matching with multiple occurances if found in same url.

    }, {
        key: '_finalReg',
        value: function _finalReg(matched, matchedOtherRun, values, key, caseNo) {
            if (caseNo === "url") {
                if (matched[0].replace(values[0], '') === matchedOtherRun[0].replace(values[1], '')) {
                    return {
                        reg: matched[0].replace(values[0], '(.*?)'),
                        pos1: 0,
                        pos2: 0
                    };
                } else {
                    return false;
                }
            }
            var length1 = matched.length;
            var length2 = matchedOtherRun.length;
            var temp = length1 - length2;
            var i = void 0;
            var j = void 0;
            if (temp === 0) {
                for (i = 0; i < length1; i++) {
                    if (matched[i].replace(values[0], '') === matchedOtherRun[i].replace(values[1], '')) {
                        return {
                            reg: matched[i].replace(values[0], '(.*?)'),
                            pos1: i,
                            pos2: i
                        };
                    }
                }
                return {
                    reg: '' + (this._fixBoundary(matched[0], matchedOtherRun[0]) !== false ? this._fixBoundary(matched[0], matchedOtherRun[0]) + '>' : false),
                    pos1: 0,
                    pos2: 0
                };
            }
            if (temp < 0) {
                for (i = 0; i < length2; i++) {
                    for (j = 0; j < length1; j++) {
                        if (matched[j].replace(values[0], '') === matchedOtherRun[i].replace(values[1], '')) {
                            return {
                                reg: matched[j].replace(values[0], '(.*?)'),
                                pos1: j,
                                pos2: i
                            };
                        }
                    }
                }
                return {
                    reg: '' + (this._fixBoundary(matched[0], matchedOtherRun[0]) !== false ? this._fixBoundary(matched[0], matchedOtherRun[0]) + '>' : false),
                    pos1: 0,
                    pos2: 0
                };
            }
            if (temp > 0) {
                for (i = 0; i < length1; i++) {
                    for (j = 0; j < length2; j++) {
                        if (matched[i].replace(values[0], '') === matchedOtherRun[j].replace(values[1], '')) {
                            return {
                                reg: matched[j].replace(values[0], '(.*?)'),
                                pos1: i,
                                pos2: j
                            };
                        }
                    }
                }
                return {
                    reg: '' + (this._fixBoundary(matched[0], matchedOtherRun[0]) !== false ? this._fixBoundary(matched[0], matchedOtherRun[0]) + '>' : false),
                    pos1: 0,
                    pos2: 0
                };
            }
            return false;
        }
    }, {
        key: '_fixBoundary',
        value: function _fixBoundary(str1, str2) {
            var arr1 = str1.split(' ');
            var arr2 = str2.split(' ');
            if (arr1.length < 1 || arr1.length < 1) return false;
            var obj1 = this._parseTag(arr1);
            var obj2 = this._parseTag(arr2);
            if (!obj1 || !obj2) return false;
            return this._compareObj(obj1, obj2);
        }
        //this is to compare tag by tab rather than characters while trying to find the final regex

    }, {
        key: '_parseTag',
        value: function _parseTag(str) {
            var len1 = str.length;
            var obj = {};
            // console.log(str[0]);
            obj['tag'] = str[0].slice(1, str[0].length);
            for (var i = 1; i < len1; i++) {
                if (str[i].indexOf('=') === -1) return false;
                var temp = str[i].split(/=(.+)/);
                if (len1 - 1 === i) {
                    obj[temp[0]] = temp[1].slice(0, -1);
                } else {
                    obj[temp[0]] = temp[1];
                }
            }
            return obj;
        }
        //comapres the different components of a tag whether two tags are equal if not make them same by replacing non matching words or components

    }, {
        key: '_compareObj',
        value: function _compareObj(obj1, obj2) {
            var str = '';
            for (var x in obj1) {
                //checking the property in other obj
                if (obj2.hasOwnProperty(x)) {

                    //check if the value is url
                    if (this._isURL(obj1[x])) {
                        str = str + ' ' + x + '=' + this._compareUrl(obj1[x], obj2[x]);
                    } else {
                        //check if value is tag
                        if (x === 'tag') {
                            //check if both tags are same
                            if (obj1[x] === obj2[x]) {
                                //modify str
                                str = str + '<' + obj1[x];
                            } else {
                                str = str + '<(.*?)';
                            }
                        } else {
                            if (obj1[x] === obj2[x]) {
                                str = str + ' ' + x + '=' + obj1[x];
                            } else {
                                str = str + ' ' + x + '=(.*?)';
                            }
                        }
                    }
                }
            }
            //console.log("str",str);
            return str;
        }
        // this to comapre urls and fix their param values

    }, {
        key: '_compareUrl',
        value: function _compareUrl(url1, url2) {
            var loc1 = new _url.URL(url1);
            var loc2 = new _url.URL(url2);
            var params1 = loc1.searchParams;
            var params2 = loc2.searchParams;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = params1[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _ref5 = _step.value;

                    var _ref6 = _slicedToArray(_ref5, 2);

                    var name = _ref6[0];
                    var value = _ref6[1];

                    if (params2.has(name)) {
                        if (params2.get(name) !== value) {
                            loc1.searchParams.set(name, '(.*?)');
                        }
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return decodeURIComponent(loc1.href);
        }
        // check if a string url

    }, {
        key: '_isURL',
        value: function _isURL(str) {
            var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?' + // port
            '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
            '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

            return pattern.test(str);
        }
    }, {
        key: '_whichFile',
        value: function () {
            var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(id) {
                var session;
                return regeneratorRuntime.wrap(function _callee5$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                if (!(id === false)) {
                                    _context6.next = 2;
                                    break;
                                }

                                return _context6.abrupt('return', {
                                    file: 'Not Found',
                                    sequence: 'Not Found'
                                });

                            case 2:
                                _context6.next = 4;
                                return _Session2.default.find({ _id: id });

                            case 4:
                                session = _context6.sent;
                                return _context6.abrupt('return', {
                                    file: session[0].title,
                                    sequence: session[0].sequence
                                });

                            case 6:
                            case 'end':
                                return _context6.stop();
                        }
                    }
                }, _callee5, this);
            }));

            function _whichFile(_x14) {
                return _ref7.apply(this, arguments);
            }

            return _whichFile;
        }()
    }]);

    return BackTrack;
}();

process.on('message', function (body) {
    new BackTrack(body);
});