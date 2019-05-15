import env from '../utility/env';

const app = {
  server: env('SERVER', "PRODUCTION"),
  jmeterPath: env('JMETER_PATH', ''),
  host: env('HOST', '0.0.0.0'),
  port: env('PORT', 4000),
  name: 'testingtool-app',
  secret: 'ANJPV4070F',
  base: env('BASE', 'http://0.0.0.0:4000'),
  chrome: env("CHROME_DRIVER", ""),
  harGenerator: env("HAR_GENERATOR", "http://127.0.0.1:8080/"),
  ignoredExt : ['css', 'jpeg', 'jpg', 'png', 'js', 'woff2', 'gif', 'PNG', 'JPG', 'JPEG', 'GIF', 'JS', 'GIF', 'woff', 'svg', 'jpt']
};

export default app;
