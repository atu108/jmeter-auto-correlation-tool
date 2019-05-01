import User from '../models/User';
import {encrypt} from '../utility/helper';
import session from '../utility/session';
import template from '../utility/template';

class AuthController{
  constructor(){
    return {
      login: this.login.bind(this),
      register: this.register.bind(this),
      logout: this.logout.bind(this)
    }
  }

  async login(ctx){
      const user = await User.findOne({email: ctx.request.body.email, password: encrypt(ctx.request.body.password)});
      console.log(ctx.request.body);
      if (user) {
        delete user.password;
        const token = await session.set(user);
        let data = {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email
      };
        ctx.body = {type:"success", message: "Login successfull", data, token};
      }else{
        ctx.body = {type: 'error', message: 'Invalid Login details'};
      }
      return;
  }

  async register(ctx){
      let {first_name, last_name, email, password, company_name } = ctx.request.body;
      const existingUser = await User.findOne({email: ctx.request.body.email});
      if(existingUser){
        return ctx.body = {type: 'success', message: 'Email already exists'};
      }
      await User.create({first_name, last_name, email, password:encrypt(password), company_name})
      ctx.body = {type: 'success', message: 'Registration successfull'};
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

  async logout(ctx){
    ctx.session = null;``
    ctx.redirect('/');
  }
}

export default new AuthController();
