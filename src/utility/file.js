import 'babel-polyfill';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import chunk from 'read-chunk';
import fileType from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
import toPromise from 'es6-promisify';

import config from "../config";
import {responses} from "./helper";

class File {
  constructor() {
    return {
      save: this.save.bind(this),
      get: this.get.bind(this),
      info: this.info.bind(this),
      delete:this.delete.bind(this),
      deleteFiles:this.deleteFiles.bind(this)
    }
  }

  async save(file, params){
    const info = await this.info(file);

    if(config.storage.mime.image.indexOf(info.mime) === -1 && config.storage.mime.video.indexOf(info.mime) === -1) return responses[415];

    return await this._save(file, info, params);
  }

  async _save(file, info, params){
    if(config.storage.default === 'file'){
      return await this._saveFile(file, info, params);
    }else if(config.storage.default === 's3'){
      return await this._saveS3(file, info, params)
    }
  }

  async _saveS3(file, info){
    const savePath = this._getPath('s3');
    const name = this._name();

    const iBucket = new AWS.S3({params: {Bucket: config.storage.s3.bucket}});

    return {
      name: name
    }
  }

  async _saveFile(file, info, params){
    let name = this._name();
    let meta = {};

    if(config.storage.mime.image.indexOf(info.mime) !== -1){
      info.type = 'image';
      name = name + '.jpeg';
      const saved = await this._saveImage(file, name, params);

      meta = {
        mime: 'image/jpeg',
        size: saved.size,
        width: saved.width,
        height: saved.height
      }
    }

    // if(config.storage.mime.video.indexOf(info.mime) !== -1){
    //   info.type = 'video';
    //   buffer = await this._saveVideo(file, name, params);
    //
    //   const saved = await toPromise(buffer.ffprobe, buffer)();
    //
    //   thumb = name + '.jpeg';
    //
    //   name = name + '.mp4';
    //
    //   meta = {
    //     mime: 'video/mp4',
    //     size: saved.format.size,
    //     width: saved.streams[0].width,
    //     height: saved.streams[0].height
    //   }
    // }

    return {
      name: name,
      type: info.type,
      meta: meta
    }
  }


  async deleteFiles(files){
    files.forEach((p)=>{
      let file = path.join(config.storage.file.path, 'main', p);
      
      if(fs.existsSync(file)) fs.unlink(file,(result)=>{
        console.log(result);
      });
      
      file = path.join(config.storage.file.path, 'thumb', p);
      
      if(fs.existsSync(file)) fs.unlink(file,(result)=>{
        console.log(result);
      });
    });
  }

  async delete(path){
    path.forEach((p)=>{
      if(fs.existsSync(p)) fs.unlink(p,(result)=>{
        console.log(result);
      });
    });
  }
  async get(path) {
    if(fs.existsSync(path)) return await fs.createReadStream(path);
    return responses[404];
  }

  async info(file){
    const part = await chunk.sync(file.path, 0, 4000);
    return fileType(part);
  }

  _name(){
    return crypto.randomBytes(20).toString('hex');
  }

  _getPath(type){
    let savePath = {
      file: {
        main: path.join(config.storage.file.path, 'main'),
        thumb: path.join(config.storage.file.path, 'thumb'),
        content: path.join(config.storage.file.path, 'content')
      },
      s3:{
        display: '/main',
        thumb: '/thumb',
        content: '/content'
      }
    };
    return savePath[type];
  }

  async _saveImage(file, name, params){
    const savePath = this._getPath('file');
    const buffer = sharp(file.path);
    let newBuffer = false;

    if(params.type === 'content'){
      newBuffer = await buffer.jpeg({
        quality: 100
      }).resize(params.width).toFile(path.join(savePath.content, name));
    }else{
      newBuffer = await buffer.jpeg({
        quality: 100
      }).resize(1920).toFile(path.join(savePath.main, name));

      await buffer.resize(500).jpeg({
        quality: 100
      }).toFile(path.join(savePath.thumb, name));
    }

    return newBuffer;
  }

  async _saveVideo(file, name){
    const savePath = this._getPath('file');
    return ffmpeg(file.path).format('mp4').screenshot({
      count: 1,
      folder: savePath.thumb,
      filename: `${name}.jpeg`,
      size: '500x?'
    }).output(path.join(savePath.display, name + '.mp4'));
  }

}

export default new File();

