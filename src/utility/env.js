import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const VARS = dotenv.parse(fs.readFileSync(path.join(__dirname, '../../.env')));

const env = (key, d) => {
  if(VARS[key]) return VARS[key];
  return d;
};

export default env;
