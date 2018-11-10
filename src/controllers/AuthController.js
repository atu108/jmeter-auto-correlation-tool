import User from '../models/User';
import {encrypt} from '../utility/helper';
import template from '../utility/template';

class AuthController{
  constructor(){
    return {
      login: this.login.bind(this),
      register: this.register.bind(this),
      logout: this.logout.bind(this),
      getlogin: this.getlogin.bind(this)
    }
  }

  async getlogin(ctx){
    if(ctx.session.user) return ctx.redirect('/app');
    ctx.body = template.render('app.auth.login', {global: {header: false, footer: false}});
  }

  async login(ctx){
      const user = await User.findOne({email: ctx.request.body.email, password: encrypt(ctx.request.body.password)});
      if (user) {
        delete user.password;
        ctx.session.user = user;
        ctx.body = JSON.stringify({type: 'success', message: 'Login success, redirecting...', redirect: '/app', _token:'ANJPP4070F', user});
      }else{
        ctx.body = JSON.stringify({type: 'error', message: 'Invalid Login details'});
      }
      return;
  }

  async register(ctx){
    if(ctx.session.user) return ctx.redirect('/app');

    if (ctx.request.method.toLowerCase() === 'post'){
      // let {first_name, last_name, email, password }
      // await User.create({ctx.request.})
    }

    ctx.body = template.render('app.auth.register', {global: {header: false, footer: false}});
  }

  async logout(ctx){
    ctx.session = null;
    ctx.redirect('/');
  }
}

export default new AuthController();
