import User from '../models/User';
import { encrypt } from '../utility/helper';
import session from '../utility/session';

class AuthController {
  constructor() {
    return {
      login: this.login.bind(this),
      register: this.register.bind(this),
      logout: this.logout.bind(this)
    }
  }

  async login(ctx) {
    const user = await User.findOne({ email: ctx.request.body.email, password: encrypt(ctx.request.body.password) });
    console.log(ctx.request.body);
    if (user) {
      delete user.password;
      const token = await session.set(user);
      let data = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        type: user.type
      };
      ctx.body = { success: true, message: "Login successfull", data, token };
    } else {
      ctx.body = { success: false, message: 'Invalid Login details' };
    }
    return;
  }

  async register(ctx) {
    try {
      let { first_name, last_name, email, password, company_name, phone, country, state, country_code } = ctx.request.body;
      const existingUser = await User.findOne({ email: ctx.request.body.email });
      if (existingUser) {
        return ctx.body = { success: false, message: 'Email already exists! Please Login !' };
      }
      await User.create({ first_name, last_name, email, password: encrypt(password), company_name, phone, country, state, country_code, type: "temp" })
      ctx.body = { success: true, message: 'Registration successfull!' };
    } catch (e) {
      console.log(e)
      ctx.body = { success: false, message: 'Something is not right!' };
    }

  }

  //   async sendresetlink(ctx, next) {
  //     const user = await User.findOne({where: {email: ctx.request.body.email}});
  //     if(!user){
  //         let code = getRandomString(10);
  //         await User.update({reset_code:code}, {where: {id: user._id}});
  //         let data = {
  //             to: user.email,
  //             subject: `Reset your password`,
  //             html: 'Click on following link to reset your password: <br>'+
  //             '<a href="">Reset Password<a>'
  //         };
  //         email.send(data);
  //         ctx.body = JSON.stringify({
  //             type: 'success',
  //             message: 'Password reset link has been sent to your email.'
  //         });
  //     }else{
  //         ctx.body = {
  //             type: 'failed',
  //             message: 'Email is not registered yet'
  //         };
  //     }
  // }

  async logout(ctx) {
    ctx.session = null;
    ctx.redirect('/');
  }
}

export default new AuthController();
