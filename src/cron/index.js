import {fork} from 'child_process';
import path from 'path';

class Cron {

  constructor(module, params) {
    const child = fork(path.join(__dirname, `../cron/${module}.js`));
    child.send(params);

    return {
      done: (callback) => {
        child.on('message', callback);
      }
    }
  }
}

export default Cron;