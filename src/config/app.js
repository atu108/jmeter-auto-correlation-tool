import env from '../utility/env';

const app = {
  host: env('HOST', '0.0.0.0'),
  port: env('PORT', 4000),
  name: 'testingtool-app',
  secret: 'ANJPV4070F',
  base: env('BASE', 'http://0.0.0.0:4000'),
  chrome: env("CHROME_DRIVER", ""),
  harGenerator: env("HAR_GENERATOR", "http://127.0.0.1:8080/")
};

export default app;
