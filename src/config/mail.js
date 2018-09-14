import env from '../utility/env';
const mail = {
  from: env('MAIL_FROM', 'hello@impulsiveweb.com'),
  host: env('MAIL_HOST', 'smtp.mailgun.org'),
  port: env('MAIL_PORT', 587),
  secure: false,
  auth: {
    type: 'login',
    user: env('MAIL_USER', 'mail@local.com'),
    pass: env('MAIL_PASSWORD', 'sample'),
  }
};

export default mail;
