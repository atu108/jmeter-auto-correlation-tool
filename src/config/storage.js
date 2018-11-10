import env from '../utility/env';

const storage = {
  path: env("JMX_PATH", "/Users/atul/webroot/testingtool/jmx/"),
  temp: env("TEMP_PATH", "")
};


export default storage;
