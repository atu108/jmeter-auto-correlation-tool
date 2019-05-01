import Mailer from 'nodemailer';

import config from '../config';

import Queue from './/queue';
import logger from './/logger';

class Email{
  constructor(){
    return {
      send: this.send.bind(this),
      init: this.init.bind(this)
    }
  }

  async init(){
    this.mailer = Mailer.createTransport(config.mail);
  }

  send(data, priority='normal'){
    Queue.mail(data, priority);
    Queue.execute('mail', this._mail.bind(this));
  }

  _mail(data, cb){
    this.mailer.sendMail(data, (error, info) => {
      if (error) {
        logger.error(error);
        return cb(error);
      }
      logger.info("Mail sent " + info.messageId);
      cb();
    });
  }
}

export default new Email();
