import path from 'path';
import edge from'edge.js';
import moment from 'moment';

import config from '../config';
import {pad} from './helper';

const view = path.join(__dirname, '../view');
const _globals = {
  header: true,
  footer: true
}

class Template{
  constructor(){
    edge.registerViews(view);
    edge.global('stringify', data => JSON.stringify(data));
    edge.global('title', title => {
      return title.toLowerCase().replace(/ /g, "-").replace(/\&/g, 'and');
    });
    
    edge.global('date', (date, format = 'MMM Do YY, HH:mm') => {
      return moment(new Date(date)).format(format);
    });

    edge.global("ceil", (num) => {
      return Math.ceil(num);
    });

    edge.global("pad", pad);
  }

  render(name, data = {}){
    
    edge.global('global', Object.assign({}, _globals, data.global, {
      authUser: edge._globals.authUser
    }));
    delete data.global;

    return edge.render(name, data);
  }
}

export default new Template();
