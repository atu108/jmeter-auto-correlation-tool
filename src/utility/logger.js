import path from 'path';
import fs from 'fs';
import moment from 'moment';

import config from '../config';
import Queue from './queue';

const DEBUG = 100;
const INFO = 200;
const WARNING = 300;
const ERROR = 400;

const levels = {
  100: 'DEBUG',
  200: 'INFO',
  300: 'WARNING',
  400: 'ERROR',
};

class Logger{

  constructor(){
    return {
      error: this._log.bind(this, ERROR),
      debug: this._log.bind(this, DEBUG),
      warn: this._log.bind(this, WARNING),
      info: this._log.bind(this, INFO)
    }
  }

  _path(){
    const date = new Date();
    return path.join(config.log.path, `App-${moment(date).format('YYYY-MM-DD')}.log`);
  }

  _log(level, error, name){
    const formatted = this._format(level, error, name);
    Queue.log({message: formatted});
    Queue.execute('log', this._write.bind(this));
  }

  _write(data, cb) {
    return fs.writeFile(this._path(), data.message + "\r\n", {
      flag: "a"
    }, function (err, res) {
      if(!err) cb();
    });
  }

  _format(level, error, name='APP'){
    if(error.stack) error = error.stack;
    return `${this._date()} ${name}-${levels[level]}: ${error}`;
  }

  _date() {
    const date = new Date();
    return `[${moment(date).format('YYYY-MM-DD')}]`;
  }
}

export default new Logger();
