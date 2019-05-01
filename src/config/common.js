import env from '../utility/env';

const common = {
  name: env('NAME', 'PerfEasy'),
  sms_footer: env('SMS_FOOTER', 'SMS_FOOTER'),
  secret: env('SECRET', 'ANJPV4070F'),
  privateKey: env('PRIVATE_KEY'),
  publicKey: env('PUBLIC_KEY'),
  jwtValidity: env('JWT_VALIDITY', '1h'),
  jwtIssuer: env('JWT_ISSUER', 'PerfEasy')
};

export default common;
