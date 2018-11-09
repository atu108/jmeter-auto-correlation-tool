'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _mongooseFindorcreate = require('mongoose-findorcreate');

var _mongooseFindorcreate2 = _interopRequireDefault(_mongooseFindorcreate);

var _mongooseError = require('../utility/mongoose-error');

var _mongooseError2 = _interopRequireDefault(_mongooseError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

var CorrelationSchema = new Schema({
    key: String,
    priority: Number,
    compared_url: String,
    location: String,
    reg_count: String,
    reg_name: String,
    reg: String,
    final_regex: String,
    first: {
        url: String,
        matched: String,
        session_title: String,
        session_sequence: Number,
        request: {
            type: Schema.Types.ObjectId,
            ref: "Request"
        },
        run: {
            type: Schema.Types.ObjectId,
            ref: "Run"
        }

    },
    second: {
        url: String,
        matched: String,
        session_title: {
            type: String,
            default: ''
        },
        session_sequence: {
            type: Number,
            default: 0
        },
        request: {
            type: Schema.Types.ObjectId,
            ref: "Request"
        },
        run: {
            type: Schema.Types.ObjectId,
            ref: "Run"
        }
    },
    scenario: {
        type: Schema.Types.ObjectId,
        ref: "Scenario"
    },
    difference: {
        type: Schema.Types.ObjectId,
        ref: "Difference"
    }
});

CorrelationSchema.plugin(_mongooseError2.default);
CorrelationSchema.plugin(_mongooseFindorcreate2.default);

exports.default = _mongoose2.default.model('Correlation', CorrelationSchema);