'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _videoshow = require('videoshow');

var _videoshow2 = _interopRequireDefault(_videoshow);

var _template = require('../utility/template');

var _template2 = _interopRequireDefault(_template);

var _helper = require('../utility/helper');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _Run = require('../models/Run');

var _Run2 = _interopRequireDefault(_Run);

var _Step = require('../models/Step');

var _Step2 = _interopRequireDefault(_Step);

var _RunValue = require('../models/RunValue');

var _RunValue2 = _interopRequireDefault(_RunValue);

var _Request = require('../models/Request');

var _Request2 = _interopRequireDefault(_Request);

var _Compare = require('../models/Compare');

var _Compare2 = _interopRequireDefault(_Compare);

var _cron = require('../cron');

var _cron2 = _interopRequireDefault(_cron);

var _Difference = require('../models/Difference');

var _Difference2 = _interopRequireDefault(_Difference);

var _MisMatchUrl = require('../models/MisMatchUrl');

var _MisMatchUrl2 = _interopRequireDefault(_MisMatchUrl);

var _Backtrack = require('../models/Backtrack');

var _Backtrack2 = _interopRequireDefault(_Backtrack);

var _Correlation = require('../models/Correlation');

var _Correlation2 = _interopRequireDefault(_Correlation);

var _Session = require('../models/Session');

var _Session2 = _interopRequireDefault(_Session);

var _url = require('url');

var _jmxConstants = require('../utility/jmxConstants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RunController = function () {
  function RunController() {
    _classCallCheck(this, RunController);

    return {
      record: this.record.bind(this),
      save: this.save.bind(this),
      compare: this.compare.bind(this),
      delete: this.delete.bind(this),
      generateJmx: this.generateJmx.bind(this)
    };
  }

  _createClass(RunController, [{
    key: 'compare',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(ctx) {
        var _this = this;

        var exists, runs, compare, job;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return _Compare2.default.find({ runs: { $in: ctx.request.body.ids } });

              case 2:
                exists = _context2.sent;

                if (!(exists && exists.length > 0)) {
                  _context2.next = 5;
                  break;
                }

                return _context2.abrupt('return', ctx.body = JSON.stringify({
                  type: "error",
                  message: "Already compared."
                }));

              case 5:
                _context2.next = 7;
                return _Run2.default.find({ _id: ctx.request.body.ids[0] });

              case 7:
                runs = _context2.sent;
                _context2.next = 10;
                return _Compare2.default.create({
                  title: "Compare Runs " + ctx.request.body.ids.join(", "),
                  runs: ctx.request.body.ids,
                  scenario: runs.scenario,
                  status: "new"
                });

              case 10:
                compare = _context2.sent;
                job = new _cron2.default('compare', compare);


                job.done(function () {
                  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(res) {
                    var differences;
                    return regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            if (!(res.comparissions.length > 0)) {
                              _context.next = 6;
                              break;
                            }

                            _context.next = 3;
                            return _Difference2.default.insertMany(res["comparissions"]);

                          case 3:
                            differences = _context.sent;
                            _context.next = 6;
                            return _this._updateComparision(differences);

                          case 6:
                            if (!(res.comparissions.length > 0)) {
                              _context.next = 9;
                              break;
                            }

                            _context.next = 9;
                            return _MisMatchUrl2.default.insertMany(res["mismatchedUrls"]);

                          case 9:
                            _context.next = 11;
                            return _Compare2.default.findByIdAndUpdate(res.compare._id, { status: "done" });

                          case 11:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this);
                  }));

                  return function (_x2) {
                    return _ref2.apply(this, arguments);
                  };
                }());

                ctx.body = JSON.stringify({
                  type: "success",
                  message: "Comparission added in qeueu to process"
                });

              case 14:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function compare(_x) {
        return _ref.apply(this, arguments);
      }

      return compare;
    }()
  }, {
    key: 'backtrack',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(ctx) {
        var _this2 = this;

        var runs, backtrack, job;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return _Run2.default.find({ scenario: ctx.request.body.scenario });

              case 2:
                runs = _context4.sent;
                _context4.next = 5;
                return _Backtrack2.default.create({
                  title: "Backtrack" + ctx.request.body.scenario_id,
                  run: ctx.request.body.ids,
                  scenario: runs.scenario,
                  status: "new"
                });

              case 5:
                backtrack = _context4.sent;
                job = new _cron2.default('backtrack', backtrack);

                job.done(function () {
                  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(res) {
                    return regeneratorRuntime.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            if (!(res.correlations.length > 0)) {
                              _context3.next = 3;
                              break;
                            }

                            _context3.next = 3;
                            return _Correlation2.default.insertMany(res['backtracks']);

                          case 3:
                            _context3.next = 5;
                            return _Backtrack2.default.create(res.backtrack._id, { status: "done" });

                          case 5:
                          case 'end':
                            return _context3.stop();
                        }
                      }
                    }, _callee3, _this2);
                  }));

                  return function (_x4) {
                    return _ref4.apply(this, arguments);
                  };
                }());
                ctx.body = JSON.stringify({
                  type: "success",
                  message: "Backtracks added in queue to process"
                });

              case 9:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function backtrack(_x3) {
        return _ref3.apply(this, arguments);
      }

      return backtrack;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(ctx) {
        var run;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return _Run2.default.create({
                  scenario: ctx.request.body.scenario,
                  title: ctx.request.body.title,
                  description: ctx.request.body.description,
                  status: "done"
                });

              case 2:
                run = _context5.sent;


                // const steIds = Object.keys(ctx.request.body.values);
                //
                // if(steIds && steIds.length > 0){
                //   const steps = await Step.find({_id:{$in:steIds}});
                //
                //   const values = [];
                //
                //   steps.forEach(step => {
                //     values.push({
                //       step: step._id,
                //       target: step.target,
                //       sequence: step.sequence,
                //       value: ctx.request.body.values[step._id],
                //       run: run._id
                //     });
                //   });
                //
                //   await RunValue.insertMany(values);
                // }

                ctx.body = JSON.stringify({
                  type: "success",
                  message: "Recording saved, reloading...",
                  reload: true
                });

              case 4:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function save(_x5) {
        return _ref5.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'delete',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(ctx) {
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return _Request2.default.deleteMany({ run: { $in: ctx.request.body } });

              case 2:
                _context6.next = 4;
                return _Run2.default.deleteMany({ _id: { $in: ctx.request.body } });

              case 4:
                _context6.next = 6;
                return _RunValue2.default.deleteMany({ run: { $in: ctx.request.body } });

              case 6:

                ctx.body = JSON.stringify({
                  type: "success",
                  message: "Deleted successfully, reloading...",
                  reload: true
                });

              case 7:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function _delete(_x6) {
        return _ref6.apply(this, arguments);
      }

      return _delete;
    }()
  }, {
    key: 'record',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(ctx) {
        var run;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return _Run2.default.update({ _id: ctx.request.body.id }, { status: "pending" });

              case 2:
                run = _context7.sent;

                ctx.body = JSON.stringify({
                  type: "success",
                  message: "Recording inititated, reloading...",
                  reload: true
                });

                // request(config.app.harGenerator, {
                //   method: 'POST',
                //   body: JSON.stringify({
                //     chrome: config.app.chrome,
                //     run_id: ctx.request.body.id,
                //     temp: config.storage.temp
                //   })
                // }).then(res => {
                //   if(res.status === 200) this._create_video(ctx.request.body.id);
                // }).catch(err => console.log(err));


              case 4:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function record(_x7) {
        return _ref7.apply(this, arguments);
      }

      return record;
    }()
  }, {
    key: '_create_video',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(id) {
        var images, videoOptions;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                images = (0, _helper.filesInDir)(_config2.default.storage.temp + id);
                videoOptions = {
                  fps: 2,
                  transition: false,
                  videoBitrate: 1024,
                  videoCodec: 'libx264',
                  size: '1920x?',
                  audioBitrate: '128k',
                  audioChannels: 2,
                  format: 'mp4',
                  pixelFormat: 'yuv420p'
                };


                (0, _videoshow2.default)(images, videoOptions).save(_config2.default.storage.path + "videos/" + id + ".mp4").on("end", function (o) {
                  console.log("Video created in:", o);
                  (0, _helper.removeDir)(_config2.default.storage.temp + id, function () {
                    return console.log("Temp files deleted");
                  });
                }).on("error", function (e, out, err) {
                  return console.log(e, err, out);
                });

              case 3:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function _create_video(_x8) {
        return _ref8.apply(this, arguments);
      }

      return _create_video;
    }()
  }, {
    key: '_updateComparision',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(object) {
        var objectCopy, check, i, j;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                objectCopy = [].concat(_toConsumableArray(object));
                check = [];
                i = 0;

              case 3:
                if (!(i < object.length)) {
                  _context9.next = 16;
                  break;
                }

                j = i;

              case 5:
                if (!(j < objectCopy.length)) {
                  _context9.next = 13;
                  break;
                }

                if (!(object[i].key === objectCopy[j].key && check.indexOf(j) === -1 && object[i]._id !== objectCopy[j]._id && object[i].first.value === objectCopy[j].first.value && object[i].second.value === objectCopy[j].second.value)) {
                  _context9.next = 10;
                  break;
                }

                _context9.next = 9;
                return _Difference2.default.findByIdAndUpdate(objectCopy[j]._id, { duplicate: object[i]._id });

              case 9:
                check.push(j);

              case 10:
                j++;
                _context9.next = 5;
                break;

              case 13:
                i++;
                _context9.next = 3;
                break;

              case 16:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function _updateComparision(_x9) {
        return _ref9.apply(this, arguments);
      }

      return _updateComparision;
    }()

    // async generateJmx(ctx){
    //   const startXML = '';
    //   const endXML = '';
    //
    //   const dynamicXML = '';
    //   const sessions = await Session.findAll({scenario:ctx.params.id});
    //   for(let i = 0; i< sessions.length; i++){
    //       const requests = await Request.findAll({});
    //     }
    // }

  }, {
    key: 'generateJmx',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {
        var _this3 = this;

        var run, startXml, endXml, dynamicData, sessions, i, requests, j, hasReg, myURL, file;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:

                // run will be paseed to this function
                run = '5b9e004a3bdf8033cfe20eec';
                startXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + '<jmeterTestPlan version="1.2" properties="3.2" jmeter="3.3 r1808647">\n' + '  <hashTree>\n' + '    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Test Plan" enabled="true">\n' + '      <stringProp name="TestPlan.comments"></stringProp>\n' + '      <boolProp name="TestPlan.functional_mode">false</boolProp>\n' + '      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>\n' + '      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">\n' + '        <collectionProp name="Arguments.arguments"/>\n' + '      </elementProp>\n' + '      <stringProp name="TestPlan.user_define_classpath"></stringProp>\n' + '    </TestPlan>\n' + '    <hashTree>\n' + '      <CacheManager guiclass="CacheManagerGui" testclass="CacheManager" testname="HTTP Cache Manager" enabled="true">\n' + '        <boolProp name="clearEachIteration">true</boolProp>\n' + '        <boolProp name="useExpires">false</boolProp>\n' + '      </CacheManager>\n' + '      <hashTree/>\n' + '      <CookieManager guiclass="CookiePanel" testclass="CookieManager" testname="HTTP Cookie Manager" enabled="true">\n' + '        <collectionProp name="CookieManager.cookies"/>\n' + '        <boolProp name="CookieManager.clearEachIteration">true</boolProp>\n' + '      </CookieManager>\n' + '      <hashTree/>\n' + '      <CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="UserCredential" enabled="true">\n' + '        <stringProp name="delimiter">,</stringProp>\n' + '        <stringProp name="fileEncoding"></stringProp>\n' + '        <stringProp name="filename">E:\\Cemex\\Cemex\\TestScripts\\Prod7_8_newWF\\TestData_P8\\TestDataCredential_v1.csv</stringProp>\n' + '        <boolProp name="ignoreFirstLine">false</boolProp>\n' + '        <boolProp name="quotedData">false</boolProp>\n' + '        <boolProp name="recycle">true</boolProp>\n' + '        <stringProp name="shareMode">shareMode.all</stringProp>\n' + '        <boolProp name="stopThread">false</boolProp>\n' + '        <stringProp name="variableNames">Username</stringProp>\n' + '      </CSVDataSet>\n' + '      <hashTree/>\n' + '      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="P8_TC01_Advance_Payment_ReferencedPayment" enabled="true">\n' + '        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>\n' + '        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">\n' + '          <boolProp name="LoopController.continue_forever">false</boolProp>\n' + '          <stringProp name="LoopController.loops">1</stringProp>\n' + '        </elementProp>\n' + '        <stringProp name="ThreadGroup.num_threads">1</stringProp>\n' + '        <stringProp name="ThreadGroup.ramp_time">1</stringProp>\n' + '        <longProp name="ThreadGroup.start_time">1511866023000</longProp>\n' + '        <longProp name="ThreadGroup.end_time">1511866023000</longProp>\n' + '        <boolProp name="ThreadGroup.scheduler">false</boolProp>\n' + '        <stringProp name="ThreadGroup.duration"></stringProp>\n' + '        <stringProp name="ThreadGroup.delay"></stringProp>\n' + '      </ThreadGroup>\n' + '      <hashTree>';
                endXml = '</hashTree><ResultCollector guiclass="StatVisualizer" testclass="ResultCollector" testname="Aggregate Report" enabled="true">\n' + '          <boolProp name="ResultCollector.error_logging">false</boolProp>\n' + '          <objProp>\n' + '            <name>saveConfig</name>\n' + '            <value class="SampleSaveConfiguration">\n' + '              <time>true</time>\n' + '              <latency>true</latency>\n' + '              <timestamp>true</timestamp>\n' + '              <success>true</success>\n' + '              <label>true</label>\n' + '              <code>true</code>\n' + '              <message>true</message>\n' + '              <threadName>true</threadName>\n' + '              <dataType>true</dataType>\n' + '              <encoding>false</encoding>\n' + '              <assertions>true</assertions>\n' + '              <subresults>true</subresults>\n' + '              <responseData>false</responseData>\n' + '              <samplerData>false</samplerData>\n' + '              <xml>false</xml>\n' + '              <fieldNames>true</fieldNames>\n' + '              <responseHeaders>false</responseHeaders>\n' + '              <requestHeaders>false</requestHeaders>\n' + '              <responseDataOnError>false</responseDataOnError>\n' + '              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>\n' + '              <assertionsResultsToSave>0</assertionsResultsToSave>\n' + '              <bytes>true</bytes>\n' + '              <sentBytes>true</sentBytes>\n' + '              <threadCounts>true</threadCounts>\n' + '              <idleTime>true</idleTime>\n' + '              <connectTime>true</connectTime>\n' + '            </value>\n' + '          </objProp>\n' + '          <stringProp name="filename">C:/ddffd/shdkjd/sfsfs.jtl</stringProp>\n' + '        </ResultCollector>\n' + '        <hashTree/>\n' + '      </hashTree>\n' + '    </hashTree>\n' + '    <WorkBench guiclass="WorkBenchGui" testclass="WorkBench" testname="WorkBench" enabled="true">\n' + '      <boolProp name="WorkBench.save">true</boolProp>\n' + '    </WorkBench>\n' + '    <hashTree/>\n' + '  </hashTree>\n' + '</jmeterTestPlan>';
                dynamicData = '';
                _context10.next = 6;
                return _Session2.default.find({ run: run });

              case 6:
                sessions = _context10.sent;
                i = 0;

              case 8:
                if (!(i < sessions.length)) {
                  _context10.next = 60;
                  break;
                }

                _context10.next = 11;
                return _Request2.default.find({ session: sessions[i]._id }).sort({ sequence: 1 });

              case 11:
                requests = _context10.sent;

                dynamicData += '<TransactionController guiclass="TransactionControllerGui" testclass="TransactionController" testname="' + sessions[i].title + '" enabled="true">\n          <boolProp name="TransactionController.includeTimers">false</boolProp>\n          <boolProp name="TransactionController.parent">false</boolProp>\n        </TransactionController><hashTree>';
                j = 0;

              case 14:
                if (!(j < requests.length)) {
                  _context10.next = 56;
                  break;
                }

                _context10.next = 17;
                return _Correlation2.default.find({ "first.request": requests[j]._id, final_regex: { $ne: 'false' } });

              case 17:
                hasReg = _context10.sent;

                // console.log("data to read", moreDynamic);
                //let hasDiff = await Difference.find({"first.request":requests[j]._id});
                myURL = new _url.URL(requests[j].url);
                _context10.t0 = '<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="' + myURL.pathname + '" enabled="true">\n            <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" enabled="true">\n            ';

                if (!(requests[j].request.post_data.length === 0)) {
                  _context10.next = 24;
                  break;
                }

                _context10.t1 = '<collectionProp name="Arguments.arguments"/>';
                _context10.next = 29;
                break;

              case 24:
                _context10.next = 26;
                return (0, _jmxConstants.resolveArray)(requests[j].request.post_data, requests[j]._id);

              case 26:
                _context10.t2 = _context10.sent;
                _context10.t3 = '<collectionProp name="Arguments.arguments">' + _context10.t2;
                _context10.t1 = _context10.t3 + '\n              </collectionProp>';

              case 29:
                _context10.t4 = _context10.t1;
                _context10.t5 = _context10.t0 + _context10.t4;
                _context10.t6 = _context10.t5 + '\n            </elementProp>\n            <stringProp name="HTTPSampler.domain">';
                _context10.t7 = myURL.hostname;
                _context10.t8 = _context10.t6 + _context10.t7;
                _context10.t9 = _context10.t8 + '</stringProp>\n            <stringProp name="HTTPSampler.port">';
                _context10.t10 = myURL.port;
                _context10.t11 = _context10.t9 + _context10.t10;
                _context10.t12 = _context10.t11 + '</stringProp>\n            <stringProp name="HTTPSampler.protocol">';
                _context10.t13 = myURL.protocol.slice(0, -1);
                _context10.t14 = _context10.t12 + _context10.t13;
                _context10.t15 = _context10.t14 + '</stringProp>\n            <stringProp name="HTTPSampler.contentEncoding"></stringProp>\n            <stringProp name="HTTPSampler.path">';
                _context10.t16 = myURL.pathname;
                _context10.t17 = _context10.t15 + _context10.t16;
                _context10.t18 = _context10.t17 + '</stringProp>\n            <stringProp name="HTTPSampler.method">';
                _context10.t19 = requests[j].request.method;
                _context10.t20 = _context10.t18 + _context10.t19;
                _context10.t21 = _context10.t20 + '</stringProp>\n            <boolProp name="HTTPSampler.follow_redirects">true</boolProp>\n            <boolProp name="HTTPSampler.auto_redirects">false</boolProp>\n            <boolProp name="HTTPSampler.use_keepalive">true</boolProp>\n            <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>\n            <stringProp name="HTTPSampler.embedded_url_re"></stringProp>\n            <stringProp name="HTTPSampler.implementation">Java</stringProp>\n            <stringProp name="HTTPSampler.connect_timeout"></stringProp>\n            <stringProp name="HTTPSampler.response_timeout"></stringProp>\n          </HTTPSamplerProxy>\n          <hashTree>\n            <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager" enabled="true">\n              <collectionProp name="HeaderManager.headers">\n              ';
                _context10.t22 = requests[j].request.headers.map(function (header) {
                  return '\n                  <elementProp name="' + Object.keys(header)[0] + '" elementType="Header">\n                  <stringProp name="Header.name">' + Object.keys(header)[0] + '</stringProp>\n                  <stringProp name="Header.value">' + header[Object.keys(header)[0]] + '</stringProp>\n            </elementProp>';
                }).join('');
                _context10.t23 = _context10.t21 + _context10.t22;
                _context10.t24 = _context10.t23 + '\n            </collectionProp>\n            </HeaderManager>\n            <hashTree/>\n            ';
                _context10.t25 = hasReg.map(function (hasReg) {
                  return '<RegexExtractor guiclass="RegexExtractorGui" testclass="RegexExtractor" testname="client_id_REX" enabled="true">\n              <stringProp name="RegexExtractor.useHeaders">false</stringProp>\n              <stringProp name="RegexExtractor.refname">' + (hasReg.key + "_COR") + '</stringProp>\n              <stringProp name="RegexExtractor.regex">' + _this3._encodeHtml(hasReg.final_regex) + '</stringProp>\n              <stringProp name="RegexExtractor.template">' + hasReg.regCount + '</stringProp>\n              <stringProp name="RegexExtractor.default">' + hasReg.key + '_Not_Found</stringProp>\n              <stringProp name="RegexExtractor.match_number">1</stringProp>\n            </RegexExtractor>\n            <hashTree/>';
                }).join('');
                _context10.t26 = _context10.t24 + _context10.t25;
                dynamicData += _context10.t26 + '\n            </hashTree>';

              case 53:
                j++;
                _context10.next = 14;
                break;

              case 56:
                dynamicData += '</hashTree>';

              case 57:
                i++;
                _context10.next = 8;
                break;

              case 60:
                // const  runDetails = await Run.findById(run).populate('scenario');
                // console.log("jmx to read",dynamicData);

                file = _fs2.default.createWriteStream(_config2.default.storage.path + 'atul.jmx');

                file.write(startXml + dynamicData + endXml);
                file.close();
                return _context10.abrupt('return', true);

              case 64:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function generateJmx() {
        return _ref10.apply(this, arguments);
      }

      return generateJmx;
    }()
  }, {
    key: '_encodeHtml',
    value: function _encodeHtml(str) {
      var escapeChars = {
        '¢': 'cent',
        '£': 'pound',
        '¥': 'yen',
        '€': 'euro',
        '©': 'copy',
        '®': 'reg',
        '<': 'lt',
        '>': 'gt',
        '"': 'quot',
        '&': 'amp',
        '\'': '#39'
      };

      var regexString = '[';
      for (var key in escapeChars) {
        regexString += key;
      }
      regexString += ']';

      var regex = new RegExp(regexString, 'g');

      return str.replace(regex, function (m) {
        return '&' + escapeChars[m] + ';';
      });
    }
  }]);

  return RunController;
}();

exports.default = new RunController();