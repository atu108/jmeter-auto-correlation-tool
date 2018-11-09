'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _env = require('../utility/env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mail = {
  from: (0, _env2.default)('MAIL_FROM', 'hello@impulsiveweb.com'),
  host: (0, _env2.default)('MAIL_HOST', 'smtp.mailgun.org'),
  port: (0, _env2.default)('MAIL_PORT', 587),
  secure: false,
  auth: {
    type: 'login',
    user: (0, _env2.default)('MAIL_USER', 'mail@local.com'),
    pass: (0, _env2.default)('MAIL_PASSWORD', 'sample')
  }
};

exports.default = mail;