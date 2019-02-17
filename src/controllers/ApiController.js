import {encrypt} from '../utility/helper';
import jwt from '../utility/jwt';

import User from '../models/User';
import Project from '../models/Project';
import Scenario from '../models/Scenario';
import Recording from '../models/Recording';
import Step from '../models/Step';
import Run from '../models/Run';
import RunValue from '../models/RunValue';
import ExcludeUrl from '../models/ExcludeUrl';
import Contact from '../models/Contact';
import Email from '../utility/mail';
import config from '../config'

class ApiController{
  constructor(){
    return {
      login: this.login.bind(this),
      projects: this.projects.bind(this),
      scenarios: this.scenarios.bind(this),
      save: this.save.bind(this),
      excludeUrls: this.excludeUrls.bind(this),
      contactForm: this.contactForm.bind(this),
      suggestionForm: this.suggestionForm.bind(this)
    }
  }

  async login(ctx){
    const user = await User.findOne({email: ctx.request.body.email, password: encrypt(ctx.request.body.password)});

    if (user) {
      delete user.password;
      const token = await jwt.set(user);
      return ctx.body = JSON.stringify({token, user, type: 'success'});
    }else{
      console.log("no valid")
    }

    return ctx.body = JSON.stringify({
      type: 'error',
      message: 'Invalid Login details'
    });
  }

  async projects(ctx){
    const projects = await Project.find({owner: ctx.auth.user.id, status: true}).exec();
    return ctx.body = JSON.stringify({projects, type:'success'});
  }

  async scenarios(ctx){
    const scenarios = await Scenario.find({project: ctx.params._id});
    return ctx.body = JSON.stringify({scenarios, type: "success"});
  }

  async save(ctx){
    let sid = false;
    const {project_id, scenario_id, recording, name} = ctx.request.body;

    sid = scenario_id;

    if(!scenario_id && project_id && name){
      const scenario = await Scenario.create({
        name: name,
        project: project_id,
        start_url: recording.startUrl
      });
      sid = scenario._id;
    }

    const r = await Recording.create({
      start_url: recording.startUrl,
      sequence_count: recording.sequence,
      ua: recording.browserVersion,
      scenario: sid
    });

    const steps = [];

    recording.steps.forEach(step => {
      const temp = {
        target: step.target,
        command: step.command,
        sequence: step.sequence,
        scenario: sid,
        recording: r._id,
      };

      if(step.value) temp.value = step.value;

      steps.push(temp);
    });

    const savedSteps = await Step.insertMany(steps);
    const run = await Run.create({
      scenario: sid,
      title: "First Run",
      description: "Saved using browser recorder",
      status: "new"
    });

    const values = [];

    savedSteps.forEach(step => {
      if(step.command === "assign"){
        values.push({
          target: step.target,
          value: step.value,
          sequence: step.sequence,
          step: step._id,
          run: run._id
        })
      }
    })

    await RunValue.insertMany(values);

    return ctx.body = {type: 'success', id: sid};
  }

  async excludeUrls(ctx){
    try{
      await ExcludeUrl.insertMany(ctx.request.body.urls.map(url => { return {url:url}}), { ordered: false, silent: true });
      return ctx.body = {type: 'success', message: 'Urls Saved'};
    }catch(e){
      if(e.code === 11000){
        return ctx.body = {type: "success", message: "Urls are saved and Duplicate urls are ignored"}
      }else{
        return ctx.body = {type: "failed", message: "Something went wrong"}
      }
     
    }
   
  }

  async contactForm(ctx){
    console.log("called")
    try{
      const {
        name,
        email,
        subject,
        message
      } = ctx.request.body
      // await Contact.create({name, email, subject, message, type:"contact"});
      let emailMessage = `<table><tr><td>Name:</td><td>${name}</td></tr><tr><td>Email:</td><td>${email}</td></tr><tr><td>Subject:</td><td>${subject}</td></tr><tr><td>Message:</td><td>${message}</td></tr>` ;
        let emailData = {
            from: config.mail.auth.user,
            html: emailMessage,
            subject: 'Contact Form',
            to: 'garg.chiku@gmail.com'
        }
        Email.send(emailData)
        ctx.set('Access-Control-Allow-Origin', '*')
        return ctx.body = {type:"success", message: "Thank you for Contacting Us"}
    }catch(e){
      return ctx.body = {type:"failed", message:"We are very Sorry, Someting went wrong"}
    }
  }

  async suggestionForm(ctx){
    console.log("hello")
    console.log("",ctx.request.body.files.file.path)
    try{
      const {
        name,
        email,
        message,
        product,
        suggestion
      } = ctx.request.body.fields;
      // await Contact.create({name, email, subject, message, type:"contact"});
      let emailMessage = `<table><tr><td>Name:</td><td>${name}</td></tr><tr><td>Email:</td><td>${email}</td><tr><td>Product:</td><td>${product}</td></tr><tr><td>Type:</td><td>${suggestion}</td></tr><tr><td>Message:</td><td>${message}</td></tr>` ;
        let emailData = {
            from: config.mail.auth.user,
            html: emailMessage,
            attachments: [
              { // use URL as an attachment
                filename: 'file.jpg',
                path: ctx.request.body.files.file.path
              }
            ],
            subject: 'Suggestion Form',
            to: 'garg.chiku@gmail.com'
        }
        Email.send(emailData)
        ctx.set('Access-Control-Allow-Origin', '*')
        return ctx.body = {type:"success", message:"Thank you for support"}
      
    }catch(e){
      ctx.set('Access-Control-Allow-Origin', '*')
      return ctx.body = {type:"failed", message:"We are very Sorry, Someting went wrong"}
    }
  }
}

export default new ApiController();
