import template from '../utility/template';

class PageController{
  constructor(){
    return {
      home: this.home.bind(this)
    }
  }

  async home(ctx){
    ctx.body = template.render('page.home');
  }
}

export default new PageController();