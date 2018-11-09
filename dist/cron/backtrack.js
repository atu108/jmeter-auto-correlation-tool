'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _logger = require('../utility/logger');

var _logger2 = _interopRequireDefault(_logger);

var _Compare = require('../models/Compare');

var _Compare2 = _interopRequireDefault(_Compare);

var _Difference = require('../models/Difference');

var _Difference2 = _interopRequireDefault(_Difference);

var _Request = require('../models/Request');

var _Request2 = _interopRequireDefault(_Request);

var _Step = require('../models/Step');

var _Step2 = _interopRequireDefault(_Step);

var _Session = require('../models/Session');

var _Session2 = _interopRequireDefault(_Session);

var _Correlation = require('../models/Correlation');

var _Correlation2 = _interopRequireDefault(_Correlation);

var _RunController = require('../controllers/RunController');

var _RunController2 = _interopRequireDefault(_RunController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var cheerio = require("cheerio");

var backtrack = function () {
    function backtrack(params) {
        _classCallCheck(this, backtrack);

        this.params = params;
        this.scenario = params.scenario;
        this.correlations = [];
        this.current = 0;
        this.connect();
    }

    _createClass(backtrack, [{
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
                var diffs, loopTimes, i, correlation;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.next = 2;
                                return _Difference2.default.find({ scenario: this.scenario }).populate('first.request', ['sequence']).populate('second.request', ['sequence']).populate('session');

                            case 2:
                                diffs = _context.sent;
                                loopTimes = diffs.length;
                                i = 0;

                            case 5:
                                if (!(i < loopTimes)) {
                                    _context.next = 16;
                                    break;
                                }

                                console.log(i);

                                if (!(diffs[i].duplicate !== '')) {
                                    _context.next = 9;
                                    break;
                                }

                                return _context.abrupt('continue', 13);

                            case 9:
                                _context.next = 11;
                                return this.searchInBodyNew(diffs[i]);

                            case 11:
                                correlation = _context.sent;

                                if (correlation) {
                                    this.correlations.push(correlation);
                                }

                            case 13:
                                i++;
                                _context.next = 5;
                                break;

                            case 16:
                                process.send({
                                    correlations: this.correlations
                                });

                            case 17:
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
        key: '_searchInBody',
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(diff) {
                var key, value1, value2, stepSeq, runs, regArr, regArr1, i, reg, reg1, matched1, matched2, matched, matchedOtherRun, finalReg;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                if (!(diff.location === 'url')) {
                                    _context2.next = 2;
                                    break;
                                }

                                return _context2.abrupt('return', false);

                            case 2:
                                //prepare regex for both run
                                // search in run 1
                                // if found then get the url and session from 1st
                                // then find in second run with constarints of url and session number
                                // if the numbers of results are multiple then start from bottom
                                // pick run 1 bottom req url and match with the second run and continue with each one then for each req follow below steps
                                //if multiple matches found in same url
                                // then find the best match using fix boundry fucntionswritten
                                //finally find the regex count and then optimal reg number // hamare kaam ka kaon sa hai will be used in creation of JMX.

                                key = diff.key.split('U+FF0E').join('.');
                                value1 = diff.first.value.replace('+', ' ');
                                value2 = diff.second.value.replace('+', ' ');

                                // console.log(diff._id,value1, value2);

                                stepSeq = [diff.first.request.sequence, diff.second.request.sequence];
                                runs = [diff.first.run, diff.second.run];
                                regArr = ['<(.*?)' + key + '=' + value1.replace('+', ' ') + '(.*?)>', '<(.*?)' + key + '(.[^<]*?)' + value1.replace('+', ' ') + '(.*?)>', '<(.*?)' + value1.replace('+', ' ') + '(.[^<]*?)' + key + '(.*?)>'];
                                regArr1 = ['<(.*?)' + key + '=' + value2.replace('+', ' ') + '(.*?)>', '<(.*?)' + key + '(.[^<]*?)' + value2.replace('+', ' ') + '(.*?)>', '<(.*?)' + value2.replace('+', ' ') + '(.[^<]*?)' + key + '(.*?)>'];
                                i = 0;

                            case 10:
                                if (!(i < regArr.length)) {
                                    _context2.next = 29;
                                    break;
                                }

                                reg = new RegExp(regArr[i], 'i');
                                reg1 = new RegExp(regArr1[i], 'i');
                                //console.log("step sequence here", stepSeq);

                                _context2.next = 15;
                                return _Request2.default.find({
                                    run: runs[0],
                                    sequence: { $lt: stepSeq[0] },
                                    'response.body': reg
                                }).sort({ step_sequence: -1 }).populate('session');

                            case 15:
                                matched1 = _context2.sent;

                                if (!(matched1.length < 1)) {
                                    _context2.next = 18;
                                    break;
                                }

                                return _context2.abrupt('continue', 26);

                            case 18:
                                _context2.next = 20;
                                return _Request2.default.find({
                                    run: runs[1],
                                    url: matched1[0].url,
                                    session_sequence: matched1[0].session_sequence,
                                    'response.body': reg1
                                }).sort({ step_sequence: -1 }).populate('session');

                            case 20:
                                matched2 = _context2.sent;
                                matched = matched1[0].response.body.match(new RegExp(regArr[i].replace('<(.*?)', '(.[^<]*?)').replace('(.*?)>', '(.*?)>{1}'), 'gi'));
                                matchedOtherRun = matched2.length > 0 ? matched2[0].response.body.match(new RegExp(regArr1[i].replace('<(.*?)', '(.[^<]*?)').replace('(.*?)>', '(.*?)>{1}'), 'gi')) : 'NA';
                                finalReg = {};


                                if (matchedOtherRun !== 'NA') {
                                    // console.log("matched arry1", matched);
                                    // console.log("matched arry2", matchedOtherRun);
                                    finalReg = this._finalReg(matched, matchedOtherRun, [value1, value2], key, i);
                                    // console.log("final reg", finalReg);
                                }

                                return _context2.abrupt('return', {
                                    key: key,
                                    priority: 1,
                                    compared_url: diff.url,
                                    location: diff.location,
                                    reg_count: finalReg.hasOwnProperty('reg') ? this._countReg(finalReg['reg']) : 'NA',
                                    optimal_reg_number: '',
                                    reg: regArr[i],
                                    final_regex: finalReg.hasOwnProperty('reg') ? finalReg['reg'] : false,
                                    first: {
                                        url: matched1[0].url,
                                        matched: finalReg.hasOwnProperty('pos1') ? matched[finalReg['pos1']] : matched.join('||'),
                                        session_title: matched1[0].session.title,
                                        session_sequence: matched1[0].session.sequence,
                                        request: matched1[0]._id,
                                        run: matched1[0].run

                                    },
                                    second: {
                                        url: matched2[0] ? matched2[0].url : 'NA',
                                        matched: finalReg.hasOwnProperty('pos2') ? matchedOtherRun[finalReg['pos2']] : matchedOtherRun !== 'NA' ? matchedOtherRun.join('||') : 'NA',
                                        session_title: matched2[0].session.title,
                                        session_sequence: matched2[0].session.sequence,
                                        request: matched2[0]._id,
                                        run: matched2[0].run

                                    },
                                    scenario: diff.scenario
                                });

                            case 26:
                                i++;
                                _context2.next = 10;
                                break;

                            case 29:
                                return _context2.abrupt('return', false);

                            case 30:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function _searchInBody(_x) {
                return _ref2.apply(this, arguments);
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
                    // console.log("values", values);
                    // console.log(matched, "------", matchedOtherRun);
                    // console.log("inside final 1",matched[i].replace(values[0], ''));
                    // console.log("inside final 2",matchedOtherRun[i].replace(values[1], ''));

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
        value: function _fixBoundary(str1, str2, values) {
            var temp = [str1.replace(values[0], '(*?)'), str2.replace(values[1], '(*?)')];
            if (temp[0] === temp[1]) return temp[0];
            // console.log("strings ", str1, str2)
            var arr1 = temp[0].split(' ');
            var arr2 = temp[1].split(' ');
            // console.log("both arrys", arr1, arr2);
            if (arr1.length < 1 || arr1.length < 1) return false;
            var obj1 = this._parseTag(arr1);
            // console.log("object parsed 1 ",obj1)
            var obj2 = this._parseTag(arr2);
            // console.log("object parsed 2 ",obj2)
            // console.log(obj2)
            if (!obj1 || !obj2) return false;
            return this._compareObj(obj1, obj2);
        }
        //this is to compare tag by tab rather than characters while trying to find the final regex

    }, {
        key: '_parseTag',
        value: function _parseTag(str) {
            console.log("in parse tag", str);
            var len1 = str.length;
            var obj = {};
            // console.log(str[0]);
            obj['tag'] = str[0].slice(1, str[0].length);
            for (var i = 1; i < len1; i++) {
                if (str[i].indexOf('=') === -1) return false;
                // console.log("reached inside")
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
            var loc1 = new URL(url1);
            var loc2 = new URL(url2);
            var params1 = loc1.searchParams;
            var params2 = loc2.searchParams;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = params1[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _ref3 = _step.value;

                    var _ref4 = _slicedToArray(_ref3, 2);

                    var name = _ref4[0];
                    var _value = _ref4[1];

                    if (params2.has(name)) {
                        if (params2.get(name) !== _value) {
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
            var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id) {
                var session;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                if (!(id === false)) {
                                    _context3.next = 2;
                                    break;
                                }

                                return _context3.abrupt('return', {
                                    file: 'Not Found',
                                    sequence: 'Not Found'
                                });

                            case 2:
                                _context3.next = 4;
                                return _Session2.default.find({ _id: id });

                            case 4:
                                session = _context3.sent;
                                return _context3.abrupt('return', {
                                    file: session[0].title,
                                    sequence: session[0].sequence
                                });

                            case 6:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function _whichFile(_x2) {
                return _ref5.apply(this, arguments);
            }

            return _whichFile;
        }()
    }, {
        key: 'searchInBodyNew',
        value: function () {
            var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(diff) {
                var key, value1, value2, finalReg, stepSeq, runs, allRequests, i, body, tags, second, sencondTags, forFinalReg, reg_name;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                key = diff.key.split('U+FF0E').join('.');
                                value1 = diff.first.value.replace('+', ' ');
                                value2 = diff.second.value.replace('+', ' ');
                                finalReg = '';
                                stepSeq = [diff.first.request.sequence, diff.second.request.sequence];
                                // console.log("inside new serach", key, "--", value1, "--",value2);

                                runs = [diff.first.run, diff.second.run];
                                _context4.next = 8;
                                return _Request2.default.find({ run: runs[0], sequence: { $lt: stepSeq[0] } }).sort({ step_sequence: -1 });

                            case 8:
                                allRequests = _context4.sent;
                                i = 0;

                            case 10:
                                if (!(i < allRequests.length)) {
                                    _context4.next = 38;
                                    break;
                                }

                                body = allRequests[i].response.body;

                                if (!(body === undefined || !body || body == '')) {
                                    _context4.next = 14;
                                    break;
                                }

                                return _context4.abrupt('continue', 35);

                            case 14:
                                if (!(diff.location === 'url')) {
                                    _context4.next = 16;
                                    break;
                                }

                                return _context4.abrupt('return', this._findAchorTag(body, key, value, allRequests[i]));

                            case 16:
                                tags = {};

                                tags.value = this.findInput(body, key, value1);
                                tags.type = 1;
                                if (!tags.value) {
                                    tags.value = this.findSelect(body, key, value1);
                                    tags.type = 2;
                                }

                                if (!(tags.value && tags.value.length > 0)) {
                                    _context4.next = 35;
                                    break;
                                }

                                _context4.next = 23;
                                return _Request2.default.find({ run: runs[1], url: allRequests[i].url, session_sequence: allRequests[i].session_sequence, 'request.method': allRequests[i].request.method });

                            case 23:
                                second = _context4.sent;
                                sencondTags = [];

                                if (tags.type === 1) {
                                    sencondTags = this.findInput(second[0].response.body, key, value2);
                                } else {
                                    sencondTags = this.findSelect(second[0].response.body, key, value2);
                                }

                                if (!(sencondTags.length > 0)) {
                                    _context4.next = 35;
                                    break;
                                }

                                forFinalReg = this.checkExactMatch(tags.value, sencondTags);

                                if (!forFinalReg) {
                                    forFinalReg = this.checkLooseMatch(tags.value, sencondTags);
                                }

                                if (!forFinalReg) {
                                    _context4.next = 35;
                                    break;
                                }

                                //removed empty space with + in cheerio returned object
                                forFinalReg[0].attribs.value = forFinalReg[0].attribs.value.replace(" ", '+');
                                forFinalReg[1].attribs.value = forFinalReg[1].attribs.value.replace(" ", '+');
                                finalReg = this._fixBoundary(cheerio.html(forFinalReg[0]), cheerio.html(forFinalReg[1]), [value1, value2]);
                                reg_name = this._getRegName(finalReg, cheerio.html(forFinalReg[0]), value1, key);
                                return _context4.abrupt('return', {
                                    key: key,
                                    priority: 1,
                                    compared_url: diff.url,
                                    location: diff.location,
                                    reg_count: this._countReg(finalReg + '>'),
                                    reg_name: reg_name,
                                    final_regex: finalReg + '>',
                                    first: {
                                        url: allRequests[i].url,
                                        matched: cheerio.html(forFinalReg[0]),
                                        session_title: allRequests[i].session.title,
                                        session_sequence: allRequests[i].session.sequence,
                                        request: allRequests[i]._id,
                                        run: allRequests[i].run

                                    },
                                    second: {
                                        url: second[0].url,
                                        matched: cheerio.html(forFinalReg[1]),
                                        session_title: second[0].session.title,
                                        session_sequence: second[0].session.sequence,
                                        request: second[0]._id,
                                        run: second[0].run

                                    },
                                    scenario: diff.scenario,
                                    difference: diff._id
                                });

                            case 35:
                                i++;
                                _context4.next = 10;
                                break;

                            case 38:
                                return _context4.abrupt('return', false);

                            case 39:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function searchInBodyNew(_x3) {
                return _ref6.apply(this, arguments);
            }

            return searchInBodyNew;
        }()
    }, {
        key: 'checkExactMatch',
        value: function checkExactMatch(tag, tag2) {
            var _loop = function _loop(i) {
                var index = tag2.findIndex(function (tg) {
                    return tag[i].type === tg.type && tag[i].name === tg.name && tag[i].parent.type === tg.parent.type && tag[i].parent.name === tg.parent.name && (tag[i].next.type === tg.next.type && tag[i].next.type === 'tag' && tag[i].next.name === tg.next.name || tag[i].next.type === tg.next.type && tag[i].next.type === 'text' && tag[i].next.body === tg.next.body) && (tag[i].prev.type === tg.prev.type && tag[i].prev.type === 'tag' && tag[i].prev.name === tg.prev.name || tag[i].prev.type === tg.prev.type && tag[i].prev.type === 'text' && tag[i].prev.body === tg.prev.body);
                });
                if (index !== -1) {
                    return {
                        v: [tag[i], tag2[index]]
                    };
                }
            };

            //console.log("input check match")
            for (var i = 0; i < tag.length; i++) {
                var _ret = _loop(i);

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }
            return false;
        }
    }, {
        key: 'checkLooseMatch',
        value: function checkLooseMatch(tag, tag2) {
            var _loop2 = function _loop2(i) {
                var index = tag2.findIndex(function (tg) {
                    return tag[i].type === tg.type && tag[i].name === tg.name && tag[i].parent.type === tg.parent.type && tag[i].parent.name === tg.parent.name;
                });
                if (index !== -1) {
                    return {
                        v: [tag[i], tag2[index]]
                    };
                }
            };

            for (var i = 0; i < tag.length; i++) {
                var _ret2 = _loop2(i);

                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
            }
            return false;
        }
    }, {
        key: 'findInput',
        value: function findInput(body, key, value) {
            try {
                var $ = cheerio.load(body.replace((/\\/g, "")));
                var inputs = $('input[name=' + key + '][value="' + value + '"]').toArray();
                // console.log("inputs check", typeof inputs, "all inouts", inputs[0]);
                if (inputs.length > 0) {
                    return inputs;
                    // return inputs;
                } else {
                    return false;
                }
            } catch (e) {
                console.log(e);
            }
        }
    }, {
        key: 'findSelect',
        value: function findSelect(body, key, value) {
            var $ = cheerio.load(body.replace((/\\/g, "")));
            var selects = $('select[name=' + key + '] option[value="' + value + '"]').toArray;
            if (selects.length > 0) {
                return selects;
            } else {
                return false;
            }
        }
    }, {
        key: '_getRegName',
        value: function _getRegName(final, matched, value, key) {
            var resultArr = matched.match(new RegExp(final + ">"));
            for (var i = 1; i < resultArr.length; i++) {
                if (resultArr[i].replace(/"/g, '').replace(/'/g, '') === value) {
                    return key + "_COR_g" + i;
                } else {
                    console.log(resultArr[i].replace('"', '', g));
                }
            }
        }

        // _findAchorTag(body,value1,value2, request){
        //     try{
        //         let $ = cheerio.load(body.replace((/\\/g, "")));
        //         let anchor1 = $('a[href="'+value1+'"]').toArray();
        //     // console.log("inputs check", typeof inputs, "all inouts", inputs[0]);
        //     if(anchor1.length > 0){
        //         let anchor2 = $('a[href="'+value2+'"]').toArray();
        //         if(anchor2.length > 0){
        //             let forFinalReg = this.checkExactMatch(anchor1, anchor2)
        //             if(!forFinalReg){
        //                 forFinalReg = this.checkLooseMatch(anchor1, anchor2);
        //             }
        //             if(forFinalReg){
        //                 finalReg = this._fixBoundary(cheerio.html(forFinalReg[0]), cheerio.html(forFinalReg[1]), [value1, value2]);
        //                 //const reg_name = this._getRegName(finalReg,cheerio.html(forFinalReg[0]),value1)
        //                 const reg_name = "pending"
        //                 return {
        //                     key: key,
        //                     priority: 1,
        //                     compared_url: diff.url,
        //                     location: diff.location,
        //                     reg_count: this._countReg(finalReg+'>'),
        //                     reg_name: reg_name,
        //                     final_regex: finalReg+'>',
        //                     first: {
        //                         url: request.url,
        //                         matched: cheerio.html(forFinalReg[0]),
        //                         session_title: request.session.title,
        //                         session_sequence:  request.session.sequence,
        //                         request:request._id,
        //                         run: request.run

        //                     },
        //                     second: {
        //                         url: second[0].url,
        //                         matched: cheerio.html(forFinalReg[1]),
        //                         session_title: second[0].session.title,
        //                         session_sequence:  second[0].session.sequence,
        //                         request: second[0]._id,
        //                         run: second[0].run

        //                     },
        //                     scenario:diff.scenario,
        //                     difference:diff._id
        //                 }
        //             }
        //         }

        //     }else{
        //         return false;
        //     }
        //     }catch(e){
        //         console.log(e);
        //     }
        // }

    }]);

    return backtrack;
}();

// process.on('message', async (params) => {
//     const compare = new Compare(params);
//     await compare.start();
// });

exports.default = new backtrack();