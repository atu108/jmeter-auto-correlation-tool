import env from '../utility/env';

const storage = {
  path: env('STORAGE_PATH', '/Users/ashok/WebRoot/company/src/static/uploads/'),
  temp: env("TEMP_PATH", "")
};


export default storage;
