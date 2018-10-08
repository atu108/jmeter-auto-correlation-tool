import env from '../utility/env';

const storage = {
  path: env('STORAGE_PATH', '/Users/atulsingh/WebRoot/testingtool/jmx/'),
  temp: env("TEMP_PATH", "")
};


export default storage;
