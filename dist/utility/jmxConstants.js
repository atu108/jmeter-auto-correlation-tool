'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.resolveArray = undefined;

var _Run = require('../models/Run');

var _Run2 = _interopRequireDefault(_Run);

var _Difference = require('../models/Difference');

var _Difference2 = _interopRequireDefault(_Difference);

var _Correlation = require('../models/Correlation');

var _Correlation2 = _interopRequireDefault(_Correlation);

var _Request = require('../models/Request');

var _Request2 = _interopRequireDefault(_Request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

//  export async function checkCorName(key , value, request){
//    const diff = await Difference.find({key,value,"first.request":request});
//    if(diff.length !== 1) return false;
//    console.log("found diff", diff);
//     if(diff[0].duplicate){
//         const col = await Correlation.find({key ,value ,"first.request":diff[0].duplicate});
//         if(col.length > 0){
//             return col[0].reg_name;
//         }else{
//             return false;
//         }

//     }else{
//         const col = await Correlation.find({key ,value ,"first.request":request});
//         console.log("correlatuio cheicng", col);
//         if(col.length > 0){
//             return col[0].reg_name;
//         }else{
//             return false 
//         }
//     }
// }
var resolveArray = exports.resolveArray = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(myArray, request_id) {
        var checkCorName = function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(key, value, request) {
                var diff, col, _col;

                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.next = 2;
                                return _Difference2.default.find({ key: key, value: value, "first.request": request });

                            case 2:
                                diff = _context.sent;

                                if (!(diff.length !== 1)) {
                                    _context.next = 5;
                                    break;
                                }

                                return _context.abrupt('return', false);

                            case 5:
                                if (!diff[0].duplicate) {
                                    _context.next = 16;
                                    break;
                                }

                                _context.next = 8;
                                return _Correlation2.default.find({ difference: diff[0].duplicate });

                            case 8:
                                col = _context.sent;

                                if (!(col.length > 0)) {
                                    _context.next = 13;
                                    break;
                                }

                                return _context.abrupt('return', "\${" + col[0].reg_name + "}");

                            case 13:
                                return _context.abrupt('return', false);

                            case 14:
                                _context.next = 24;
                                break;

                            case 16:
                                _context.next = 18;
                                return _Correlation2.default.find({ difference: diff[0]._id });

                            case 18:
                                _col = _context.sent;

                                if (!(_col.length > 0)) {
                                    _context.next = 23;
                                    break;
                                }

                                return _context.abrupt('return', "\${" + _col[0].reg_name + "}");

                            case 23:
                                return _context.abrupt('return', false);

                            case 24:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            return function checkCorName(_x3, _x4, _x5) {
                return _ref2.apply(this, arguments);
            };
        }();

        var toSend, i, temp;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        toSend = '';
                        i = 0;

                    case 2:
                        if (!(i < myArray.length)) {
                            _context2.next = 10;
                            break;
                        }

                        _context2.next = 5;
                        return checkCorName(Object.keys(myArray[i])[0], myArray[Object.keys(myArray[i])[0]], request_id);

                    case 5:
                        temp = _context2.sent;

                        toSend += '<elementProp name="key" elementType="HTTPArgument">\n      <boolProp name="HTTPArgument.always_encode">false</boolProp>\n      <stringProp name="Argument.name">' + Object.keys(myArray[i])[0] + '</stringProp>\n      <stringProp name="Argument.value">' + (temp ? temp : myArray[i][Object.keys(myArray[i])[0]]) + '</stringProp>\n      <stringProp name="Argument.metadata">=</stringProp>\n      <boolProp name="HTTPArgument.use_equals">true</boolProp>\n    </elementProp>';

                    case 7:
                        i++;
                        _context2.next = 2;
                        break;

                    case 10:
                        console.log("cheching to send", toSend);
                        return _context2.abrupt('return', toSend);

                    case 12:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined);
    }));

    return function resolveArray(_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();